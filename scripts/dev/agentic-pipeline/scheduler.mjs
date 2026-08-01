import { loadCatalog, resolvePackModel } from './catalog.mjs';

/**
 * Decide whether a pack/model may start given currently loaded models.
 * @param {{ packId: string, model?: string, mode?: 'serial'|'parallel'|'dry-run', loaded?: { model: string, packId: string, estVramGb: number }[], freeVramGbByGpu?: number[] }} req
 */
export function canStartPack(req) {
  const catalog = loadCatalog();
  const mode = req.mode || 'serial';
  if (mode === 'dry-run') {
    return { ok: true, dryRun: true, model: null };
  }

  const resolved = resolvePackModel(req.packId, req.model, catalog);
  if (!resolved.ok) return resolved;

  const loaded = req.loaded || [];
  if (mode === 'serial' && loaded.length > 0) {
    return {
      ok: false,
      error: 'serial mode: unload other models first',
      schedulerReason: 'serial-occupied',
      recommended: resolved.recommended,
    };
  }

  const groups = new Set(resolved.exclusiveGroups || []);
  for (const L of loaded) {
    const other = resolvePackModel(L.packId, L.model, catalog);
    const otherGroups = new Set(other.ok ? other.exclusiveGroups : []);
    for (const g of groups) {
      if (otherGroups.has(g)) {
        return {
          ok: false,
          error: `exclusive group conflict: ${g}`,
          schedulerReason: `exclusive:${g}`,
          recommended: resolved.recommended,
        };
      }
    }
    if (
      groups.has('visual-gen-polish') &&
      otherGroups.has('visual-gen-polish')
    ) {
      return {
        ok: false,
        error: 'visual gen and polish cannot co-load',
        schedulerReason: 'exclusive:visual-gen-polish',
      };
    }
  }

  if (resolved.estVramGb >= 14) {
    const free = req.freeVramGbByGpu || [];
    const fits = free.some((f) => f >= resolved.estVramGb - 1);
    if (free.length && !fits) {
      return {
        ok: false,
        error: `insufficient free VRAM for ~${resolved.estVramGb}GB model`,
        schedulerReason: 'vram',
        recommended: resolved.recommended,
      };
    }
  }

  return {
    ok: true,
    model: resolved.model,
    estVramGb: resolved.estVramGb,
    exclusiveGroups: resolved.exclusiveGroups,
    gpuHint: resolved.estVramGb >= 18 ? 'prefer-16gb' : 'any',
  };
}
