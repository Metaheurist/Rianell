/**
 * Shared pack runner: gates → Research (Firecrawl) → optional streamed LLM → proposal → pending_approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeAgentContext } from '../sanitize-agent-context.mjs';
import { resolvePackModel } from './catalog.mjs';
import { canStartPack } from './scheduler.mjs';
import { probeHardwareProfile } from '../probe-hardware-profile.mjs';
import {
  ROOT,
  ensureDir,
  packDir,
  readPackState,
  writePackState,
} from './state.mjs';
import { ollamaGenerateStream, ollamaUnload } from './ollama-client.mjs';
import {
  extractProposalFromMarkdown,
  humanGateLabel,
  writeProposal,
  emptyProposal,
} from './proposal.mjs';
import { buildPackLlmPrompt, ADVISORY_SYSTEM } from './pack-context.mjs';
import { silentSpawnSync } from './spawn-silent.mjs';
import { researchBeforeLlm, researchRefineProposal } from './research-pack.mjs';
import {
  authorPatchBodies,
  ensureFindingsFallbackItem,
  reselectMutateItems,
} from './patch-author.mjs';
import { readModePrefs } from './mode-prefs.mjs';

let hwProfileCache = null;

async function resolveHwProfileHint(dryRun) {
  if (dryRun) return null;
  const now = Date.now();
  if (hwProfileCache && now - hwProfileCache.at < 60_000) return hwProfileCache.profile;
  try {
    const profile = await probeHardwareProfile();
    hwProfileCache = { at: now, profile };
    return profile;
  } catch {
    return null;
  }
}

/**
 * @param {string} packId
 * @param {{
 *   gates?: { cmd: string, args?: string[], cwd?: string }[],
 *   dryRun?: boolean,
 *   model?: string,
 *   stage?: string,
 *   llmPrompt?: string,
 *   llmTopic?: string,
 *   llmSystem?: string,
 *   skipLlm?: boolean,
 *   enrichContext?: boolean,
 *   defaultKind?: string,
 *   defaultAdapter?: string,
 *   afterGates?: (ctx: object) => Promise<object|null>,
 *   beforeLlm?: (ctx: object) => Promise<object|null>,
 *   skipResearch?: boolean,
 * }} opts
 */
export async function runPack(packId, opts = {}) {
  const dryRun = Boolean(opts.dryRun || process.env.AGENTIC_DRY_RUN === '1');
  const hwHint = await resolveHwProfileHint(dryRun);
  const resolved = resolvePackModel(packId, opts.model, undefined, hwHint);
  if (!resolved.ok) {
    return { ok: false, pack: packId, error: resolved.error, data: null };
  }

  const sched = canStartPack({
    packId,
    model: resolved.model,
    mode: dryRun ? 'dry-run' : 'serial',
    loaded: [],
  });
  if (!sched.ok) {
    return { ok: false, pack: packId, error: sched.error, schedulerReason: sched.schedulerReason, data: null };
  }

  writePackState(packId, {
    ...readPackState(packId),
    status: 'running',
    model: dryRun ? null : resolved.model,
    stage: opts.stage || 'gates',
    paused: false,
    startedAt: new Date().toISOString(),
  });

  const gateResults = [];
  for (const g of opts.gates || []) {
    const cmd = g.cmd;
    const args = g.args || [];
    if (dryRun) {
      gateResults.push({ cmd: [cmd, ...args].join(' '), status: 'skipped-dry-run', code: 0 });
      continue;
    }
    const res = silentSpawnSync(cmd, args, {
      cwd: g.cwd || ROOT,
      env: process.env,
    });
    const spawnErr = res.error ? String(res.error.message || res.error) : '';
    gateResults.push({
      cmd: [cmd, ...args].join(' '),
      status: res.status === 0 ? 'pass' : 'fail',
      code: res.status,
      stderr: (spawnErr || String(res.stderr || '')).slice(0, 2000),
      stdout: String(res.stdout || '').slice(0, 2000),
    });
  }

  const gatesFailed = gateResults.some((g) => g.status === 'fail');
  const gateMeta = gateResults.map((g) => ({
    label: humanGateLabel(g.cmd),
    status: g.status,
    cmd: g.cmd,
  }));

  let llm = null;
  const dir = packDir(packId);
  ensureDir(dir);

  // Shared Research stage (Firecrawl) — every pack unless skipResearch.
  let beforeLlmMeta = null;
  const beforeLlmFn = opts.skipResearch
    ? null
    : (typeof opts.beforeLlm === 'function' ? opts.beforeLlm : researchBeforeLlm);
  if (beforeLlmFn && !gatesFailed) {
    writePackState(packId, { ...readPackState(packId), stage: 'research', status: 'running' });
    try {
      beforeLlmMeta = await beforeLlmFn({
        packId,
        dryRun,
        model: resolved.model,
        gateResults,
        dir,
        topic: opts.llmTopic || opts.llmPrompt || packId,
        fromRunAll: Boolean(opts.fromRunAll),
      });
    } catch (err) {
      // Soft-fail: continue without web brief rather than killing the pack.
      beforeLlmMeta = {
        stage: 'research',
        error: String(err?.message || err),
        llmPromptExtra: `## Web research (Firecrawl)\n\nResearch stage error (continuing offline): ${String(err?.message || err)}\n`,
      };
    }
  }

  if (!opts.skipLlm && (opts.llmPrompt || opts.llmTopic) && !dryRun && !gatesFailed) {
    writePackState(packId, { ...readPackState(packId), stage: 'llm', status: 'running' });
    const enrich = opts.enrichContext !== false;
    let promptText = opts.llmPrompt || '';
    let contextMeta = null;
    if (enrich) {
      const built = buildPackLlmPrompt({
        packId,
        topic: opts.llmTopic || opts.llmPrompt || packId,
        gateResults,
        writeArtifactDir: dir,
      });
      // Prefer assembled codebase context; append any handler-specific tail after a short separator.
      promptText = built.prompt;
      if (opts.llmPrompt && opts.llmPrompt.length < 500 && !opts.llmPrompt.includes('## Repo context')) {
        promptText = `${built.prompt}\n\n## Handler notes\n${sanitizeAgentContext(opts.llmPrompt).text}\n`;
      }
      contextMeta = built.meta;
    } else {
      promptText = opts.llmPrompt;
    }
    if (beforeLlmMeta?.llmPromptExtra) {
      promptText = `${promptText}\n\n${sanitizeAgentContext(beforeLlmMeta.llmPromptExtra).text}\n`;
    }
    const clean = sanitizeAgentContext(promptText);
    const sys = sanitizeAgentContext(opts.llmSystem || ADVISORY_SYSTEM).text;
    const partialPath = path.join(dir, 'llm-stream.partial.md');
    const metaPath = path.join(dir, 'llm-stream.meta.json');
    fs.writeFileSync(partialPath, '');
    fs.writeFileSync(metaPath, `${JSON.stringify({
      done: false,
      model: resolved.model,
      updatedAt: new Date().toISOString(),
      contextFiles: contextMeta?.filesUsed?.length || 0,
    })}\n`);
    let lastFlush = 0;
    try {
      const text = await ollamaGenerateStream({
        model: resolved.model,
        prompt: clean.text,
        system: sys,
        numPredict: 1800,
        onChunk: (_piece, full) => {
          const now = Date.now();
          if (now - lastFlush > 100) {
            fs.writeFileSync(partialPath, full);
            fs.writeFileSync(metaPath, `${JSON.stringify({ done: false, model: resolved.model, updatedAt: new Date().toISOString() })}\n`);
            lastFlush = now;
          }
        },
      });
      const finalText = sanitizeAgentContext(text).text.slice(0, 12000);
      fs.writeFileSync(partialPath, finalText);
      fs.writeFileSync(metaPath, `${JSON.stringify({ done: true, model: resolved.model, updatedAt: new Date().toISOString() })}\n`);
      llm = { ok: true, text: finalText };
    } catch (err) {
      // Salvage streamed partial when the socket dies mid-generate so the pack
      // can still open a proposal instead of hard-breaking the run-all.
      let partial = '';
      try {
        if (fs.existsSync(partialPath)) partial = fs.readFileSync(partialPath, 'utf8');
      } catch { /* ignore */ }
      const salvaged = sanitizeAgentContext(partial).text.slice(0, 12000);
      const usable = salvaged.length >= 280 && /##\s*Proposed|^\s*\d+\.\s+/m.test(salvaged);
      fs.writeFileSync(metaPath, `${JSON.stringify({
        done: true,
        error: true,
        salvaged: usable,
        updatedAt: new Date().toISOString(),
      })}\n`);
      llm = usable
        ? {
          ok: true,
          text: salvaged,
          degraded: true,
          error: String(err?.message || err),
        }
        : { ok: false, error: String(err?.message || err) };
    } finally {
      await ollamaUnload(resolved.model);
    }
  } else if (dryRun && (opts.llmPrompt || opts.llmTopic)) {
    const built = buildPackLlmPrompt({
      packId,
      topic: opts.llmTopic || opts.llmPrompt || packId,
      gateResults,
      writeArtifactDir: dir,
    });
    const fileHint = (built.meta.filesUsed || []).slice(0, 6).join(', ') || '(no docs)';
    const extraHint = beforeLlmMeta?.llmPromptExtra
      ? `\n[dry-run] Also attached beforeLlm research brief (${String(beforeLlmMeta.llmPromptExtra).length} chars).`
      : '';
    llm = {
      ok: true,
      text: [
        '## Thinking',
        `[dry-run] LLM skipped. Would load codebase context (${built.meta.filesUsed?.length || 0} files): ${fileHint}.${extraHint}`,
        '',
        '## Proposed actions',
        '1. Acknowledge dry-run advisory stub (re-run without --dry-run for path-grounded proposals)',
      ].join('\n'),
      dryRun: true,
    };
  }

  let customProposal = null;
  if (typeof opts.afterGates === 'function' && !gatesFailed) {
    writePackState(packId, { ...readPackState(packId), stage: opts.stage || 'post', status: 'running' });
    try {
      customProposal = await opts.afterGates({
        packId,
        dryRun,
        model: resolved.model,
        gateResults,
        llm,
        beforeLlmMeta,
        fromRunAll: Boolean(opts.fromRunAll),
      });
    } catch (err) {
      return {
        ok: false,
        pack: packId,
        error: String(err?.message || err),
        data: null,
      };
    }
  }

  const reportOk = !gatesFailed && (!llm || llm.ok !== false);
  const report = {
    pack: packId,
    ok: reportOk,
    model: resolved.model,
    stage: opts.stage || 'default',
    dryRun,
    gates: gateResults,
    llm,
    broken: gatesFailed
      ? gateResults.filter((g) => g.status === 'fail').map((g) => g.cmd)
      : [],
    finishedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dir, 'broken.json'),
    `${JSON.stringify(report.broken, null, 2)}\n`,
  );
  if (llm?.text) {
    fs.writeFileSync(path.join(dir, 'llm-advisory.md'), `${llm.text}\n`);
  }

  let proposal = customProposal;
  if (!proposal && llm?.text) {
    proposal = extractProposalFromMarkdown(packId, llm.text, {
      model: resolved.model,
      gates: gateMeta,
      dryRun,
      defaultKind: opts.defaultKind || 'ack_only',
      defaultAdapter: opts.defaultAdapter || 'ack',
    });
  } else if (!proposal && reportOk) {
    proposal = emptyProposal(packId, {
      model: resolved.model,
      status: dryRun ? 'dry_run' : 'pending_approval',
      summary: gatesFailed ? 'Gates failed' : 'Acknowledge gate results',
      thinking: 'Gates completed. No LLM advisory for this pack.',
      items: [{
        id: `${packId}-ack`,
        kind: 'ack_only',
        title: 'Acknowledge gate results',
        detail: 'Mark checks reviewed.',
        risk: 'low',
        targets: [],
        selected: true,
        applyAdapter: 'ack',
      }],
      gates: gateMeta,
    });
  }

  if (proposal && reportOk) {
    const prefs = readModePrefs();
    const productWrite = !dryRun && (
      prefs.autoApproveMode === 'product-write'
      || Boolean(opts.productWrite)
      || prefs.confirmProductWrite
    );

    if (!customProposal) {
      proposal = researchRefineProposal(proposal);
      proposal = {
        ...proposal,
        items: (proposal.items || []).map((it) => {
          if (it.kind === 'file_write' || it.kind === 'file_create' || it.kind === 'doc_patch' || it.kind === 'code_hint') {
            return { ...it, applyAdapter: 'safe-patch' };
          }
          return it;
        }),
      };
      proposal = {
        ...proposal,
        items: reselectMutateItems(proposal.items, { productWrite }),
      };
      if (!dryRun) {
        proposal = {
          ...proposal,
          items: await authorPatchBodies(packId, proposal.items, {
            model: resolved.model,
            dryRun,
          }),
        };
      }
    }

    if (productWrite && !dryRun) {
      proposal = {
        ...proposal,
        items: ensureFindingsFallbackItem(packId, proposal.items, proposal.thinking),
        summary: `${(proposal.items || []).length} proposed action(s)`,
      };
    }

    writeProposal(packId, proposal);
  }

  const terminal = !reportOk
    ? 'broken'
    : (dryRun ? 'passed' : 'pending_approval');

  writePackState(packId, {
    ...readPackState(packId),
    status: terminal,
    model: null,
    stage: terminal === 'pending_approval' ? 'pending_approval' : report.stage,
    finishedAt: report.finishedAt,
  });

  return {
    ok: reportOk,
    pack: packId,
    error: null,
    data: report,
    needsApproval: terminal === 'pending_approval',
    proposal,
  };
}

/**
 * Gate via package.json script name. `silentSpawnSync` resolves `npm run`
 * to a direct `node <file>` invocation on Windows so no cmd.exe flashes.
 */
export function npmGate(script) {
  return { cmd: 'npm', args: ['run', script] };
}

export function nodeGate(scriptPath, extraArgs = []) {
  return { cmd: 'node', args: [scriptPath, ...extraArgs] };
}
