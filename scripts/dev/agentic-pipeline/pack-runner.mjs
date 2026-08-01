/**
 * Shared pack runner: deterministic npm/node gates → optional LLM advisory → report under artifacts/agentic/<pack>/.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeAgentContext } from '../sanitize-agent-context.mjs';
import { resolvePackModel } from './catalog.mjs';
import { canStartPack } from './scheduler.mjs';
import {
  ROOT,
  ensureDir,
  packDir,
  readPackState,
  writePackState,
} from './state.mjs';
import { ollamaGenerate, ollamaUnload } from './ollama-client.mjs';

/**
 * @typedef {{ cmd: string, args?: string[], cwd?: string }} GateCmd
 */

/**
 * @param {string} packId
 * @param {{
 *   gates?: GateCmd[],
 *   dryRun?: boolean,
 *   model?: string,
 *   stage?: string,
 *   llmPrompt?: string,
 *   llmSystem?: string,
 *   skipLlm?: boolean,
 * }} opts
 */
export async function runPack(packId, opts = {}) {
  const dryRun = Boolean(opts.dryRun || process.env.AGENTIC_DRY_RUN === '1');
  const resolved = resolvePackModel(packId, opts.model);
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
    stage: opts.stage || 'default',
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
    const res = spawnSync(cmd, args, {
      cwd: g.cwd || ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: process.env,
    });
    gateResults.push({
      cmd: [cmd, ...args].join(' '),
      status: res.status === 0 ? 'pass' : 'fail',
      code: res.status,
      stderr: String(res.stderr || '').slice(0, 2000),
      stdout: String(res.stdout || '').slice(0, 2000),
    });
  }

  const gatesFailed = gateResults.some((g) => g.status === 'fail');
  let llm = null;
  if (!opts.skipLlm && opts.llmPrompt && !dryRun && !gatesFailed) {
    const clean = sanitizeAgentContext(opts.llmPrompt);
    const sys = opts.llmSystem ? sanitizeAgentContext(opts.llmSystem).text : undefined;
    try {
      const text = await ollamaGenerate({
        model: resolved.model,
        prompt: clean.text,
        system: sys,
        numPredict: 1500,
      });
      llm = { ok: true, text: sanitizeAgentContext(text).text.slice(0, 12000) };
    } catch (err) {
      llm = { ok: false, error: String(err?.message || err) };
    } finally {
      await ollamaUnload(resolved.model);
    }
  } else if (dryRun && opts.llmPrompt) {
    llm = { ok: true, text: '[dry-run] LLM skipped', dryRun: true };
  }

  const report = {
    pack: packId,
    ok: !gatesFailed && (!llm || llm.ok !== false),
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

  const dir = packDir(packId);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (report.broken.length) {
    fs.writeFileSync(path.join(dir, 'broken.json'), `${JSON.stringify(report.broken, null, 2)}\n`);
  } else {
    fs.writeFileSync(path.join(dir, 'broken.json'), '[]\n');
  }
  if (llm?.text) {
    fs.writeFileSync(path.join(dir, 'llm-advisory.md'), `${llm.text}\n`);
  }

  writePackState(packId, {
    ...readPackState(packId),
    status: report.ok ? 'passed' : 'broken',
    model: null,
    finishedAt: report.finishedAt,
  });

  return { ok: report.ok, pack: packId, error: null, data: report };
}

export function npmGate(script) {
  return { cmd: 'npm', args: ['run', script] };
}

export function nodeGate(scriptPath, extraArgs = []) {
  return { cmd: 'node', args: [scriptPath, ...extraArgs] };
}
