/**
 * Shared SVG / CSS-animation preview helpers for visual galleries.
 * Used by visual-polish-live-preview.mjs and visual-current-gallery.mjs.
 */
import { extractSvgUnit, hasUsableSvg, extractCssKeyframes } from './visual-polish-queue.mjs';

export function stemFromId(id) {
  return String(id || '')
    .replace(/^(?:sprite|fancy|nav|avatar|sprout):/, '')
    .replace(/:(?:mint|mono|rainbow|red-black)$/, '')
    || String(id || '');
}

export function teamRank(team) {
  const order = { '': 0, mint: 1, mono: 2, 'red-black': 3, rainbow: 4 };
  return order[team || ''] ?? 9;
}

/**
 * Truncated polished SVGs (mid-attribute, unclosed <g>) break gallery innerHTML
 * so later cards nest inside earlier stages and the scroll sentinel disappears —
 * which looked like "stuck at 300 loaded". Refuse or repair before inject.
 */
export function sanitizeSvgMarkup(svg) {
  let t = String(svg || '').trim();
  if (!t) return '';
  // Odd quotes ⇒ truncated attribute (e.g. class="…theme</svg>) — never inject
  if ((t.match(/"/g) || []).length % 2 === 1) return '';
  if ((t.match(/'/g) || []).length % 2 === 1 && /=\s*'[^']*$/.test(t)) return '';
  // Strip accidental HTML breakout tags inside SVG payloads
  t = t.replace(/<\/?(?:div|span|article|section|script|style|html|body)\b[^>]*>/gi, '');
  const balance = (tag) => {
    const re = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
    let openCount = 0;
    let m;
    while ((m = re.exec(t))) {
      if (String(m[1] || '').trim().endsWith('/')) continue;
      openCount += 1;
    }
    const closes = (t.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (openCount > closes) t += `</${tag}>`.repeat(openCount - closes);
  };
  balance('defs');
  balance('clipPath');
  balance('mask');
  balance('g');
  balance('svg');
  if ((t.match(/"/g) || []).length % 2 === 1) return '';
  return t;
}

export function wrapSvg(inner, vb = '0 0 24 24') {
  let t = extractSvgUnit(inner);
  if (!t) t = String(inner || '').trim();
  if (!t) return '';
  if (/^<svg[\s>]/i.test(t)) {
    // Only force paint when the root is fill=none AND there is no stroke ink
    if (
      /^\s*<svg\b[^>]*\bfill="none"/i.test(t)
      && !/\bstroke\s*=\s*["'](?!none)[^"']+/i.test(t)
      && !/\bfill="currentColor"/i.test(t)
    ) {
      t = t.replace(/\bfill="none"/i, 'fill="currentColor"');
    }
    return sanitizeSvgMarkup(t);
  }
  if (/^<symbol[\s>]/i.test(t)) {
    t = t
      .replace(/^<symbol\b/i, '<svg')
      .replace(/<\/symbol>/i, '</svg>');
    // Do NOT rewrite child fill="none" (stroke rings / chart axes rely on it)
    if (
      /^\s*<svg\b[^>]*\bfill="none"/i.test(t)
      && !/\bstroke\s*=\s*["'](?!none)[^"']+/i.test(t)
    ) {
      t = t.replace(/\bfill="none"/i, 'fill="currentColor"');
    }
    return sanitizeSvgMarkup(t);
  }
  if (!hasUsableSvg(t) && !/<(?:path|circle|ellipse|rect|g|line|polyline|polygon)\b\s/i.test(t)) {
    return '';
  }
  return sanitizeSvgMarkup(
    `<svg viewBox="${vb}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${t}</svg>`,
  );
}

export function uniqueIds(svg, salt) {
  return String(svg)
    .replace(/\bid=(["'])([^"']+)\1/g, (_m, q, id) => `id=${q}${salt}-${id}${q}`)
    .replace(/url\((["']?)#([^)"']+)\1\)/g, (_m, _q, id) => `url(#${salt}-${id})`);
}

/** Timing guess from keyframe name / body so demos look intentional. */
export function animTimingFor(name, css) {
  const n = String(name || '').toLowerCase();
  const body = String(css || '').toLowerCase();
  if (/wave|shift/.test(n)) return '2.4s linear infinite';
  if (/pour|slosh/.test(n)) return '0.7s ease-in-out infinite alternate';
  if (/spin|rotate|draw/.test(n)) return '1.2s linear infinite';
  if (/pulse|glow|shimmer|beacon|radiate|urgent/.test(n)) return '1.4s ease-in-out infinite';
  if (/float|sway|tilt|cloud|bubble|rise/.test(n)) return '2.2s ease-in-out infinite';
  if (/stamp|pop|in\b|fade|slide|scale/.test(n)) return '1.1s ease-out infinite alternate';
  if (/heartbeat|beat|ekg|ecg/.test(n)) return '0.9s ease-in-out infinite';
  if (/translatex/.test(body)) return '2.4s linear infinite';
  if (/rotate|hue/.test(body)) return '1.5s linear infinite';
  return '1.5s ease-in-out infinite';
}

/** Designated demo glyph for this animation — not the keyframes themselves. */
export function designatedAnimIcon(idOrName) {
  const n = String(idOrName || '').toLowerCase();
  // Pill spin: 64×64 demo centered at 32,32 so product origin spins in place (not orbit).
  // NEVER a spinner ring (double-spin with rotate keyframes).
  if (/pill|medication/.test(n) || (/spin/.test(n) && !/loader|flood|planet|spark/.test(n))) {
    return {
      kind: 'pill',
      label: 'pill · in-place spin (origin center)',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="anim-target" fill="currentColor">
          <rect x="14" y="26" width="36" height="12" rx="6"/>
          <rect x="32" y="26" width="18" height="12" rx="6" opacity=".35"/>
        </g>
      </svg>`,
    };
  }
  // Droplet wave: seamless repeating tile (period 12) — translate must be ±12/24/… so no end-edge seam.
  if (/glucose|hydration|wave|pour|slosh|droplet|pool/.test(n)) {
    return {
      kind: 'wave',
      label: 'droplet · seamless looping wave',
      svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs><clipPath id="CLIP"><path d="M24 6C24 6 10 22 10 30a14 14 0 0 0 28 0C38 22 24 6 24 6z"/></clipPath></defs>
        <path d="M24 6C24 6 10 22 10 30a14 14 0 0 0 28 0C38 22 24 6 24 6z" fill="none" stroke="currentColor" stroke-width="2"/>
        <g clip-path="url(#CLIP)">
          <g class="anim-target">
            <path fill="currentColor" opacity=".85" d="M-48 28c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0v28H-48z"/>
            <path fill="currentColor" opacity=".45" d="M-48 32c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0 8-3 12 0 8 3 12 0 8-3 12 0 8 3 12 0 8-3 12 0 8 3 12 0v24H-48z"/>
          </g>
        </g>
      </svg>`,
    };
  }
  if (/heart|bp|beat|ekg|ecg|vital/.test(n)) {
    return {
      kind: 'heart',
      label: 'heart',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="anim-target" fill="currentColor">
          <path d="M12 21s-7-4.35-9.5-8.2C.5 9.4 2.2 5.5 6 5.5c2.1 0 3.4 1.2 4 2.2.6-1 1.9-2.2 4-2.2 3.8 0 5.5 3.9 3.5 7.3C19 16.65 12 21 12 21z"/>
        </g>
      </svg>`,
    };
  }
  if (/loader|flood|planet|spark/.test(n)) {
    return {
      kind: 'spinner',
      label: 'static ring + moving arc',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity=".22"/>
        <g class="anim-target" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M20 12a8 8 0 0 0-8-8"/>
        </g>
      </svg>`,
    };
  }
  if (/steps|foot/.test(n)) {
    return {
      kind: 'foot',
      label: 'footprint',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="anim-target" fill="currentColor">
          <ellipse cx="9" cy="8" rx="2.2" ry="3"/><ellipse cx="13.5" cy="7.2" rx="1.6" ry="2.4"/>
          <ellipse cx="17" cy="9" rx="1.4" ry="2"/><path d="M7 13c0-2 2.5-3.2 5-3.2S17 11 17 13c0 3-2.2 6-5 6s-5-3-5-6z"/>
        </g>
      </svg>`,
    };
  }
  if (/nav|home|icon/.test(n)) {
    return {
      kind: 'nav',
      label: 'nav glyph',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="anim-target" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
          <path d="M4 11.5 12 4l8 7.5"/><path d="M7 10.5V20h10v-9.5"/>
        </g>
      </svg>`,
    };
  }
  return {
    kind: 'chip',
    label: 'demo chip',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="anim-target">
        <rect x="8" y="14" width="32" height="20" rx="10" fill="currentColor" opacity=".22"/>
        <rect x="12" y="18" width="24" height="12" rx="6" fill="currentColor"/>
      </g>
    </svg>`,
  };
}

/**
 * Build a live CSS-animation stage: designated icon + scoped @keyframes.
 */
export function buildAnimStageHtml(kf, salt, entryId) {
  if (!kf?.name || !kf?.css) return '';
  const scoped = `prev_${String(salt).replace(/[^a-zA-Z0-9_]/g, '_')}_${kf.name}`;
  // Drop keyframe transform-origin so preview origin:center / product-matched demos spin in place
  // (e.g. achPillSpin's 32px 32px orbited the old 48×48 demo).
  let css = kf.css.replace(new RegExp(`@keyframes\\s+${kf.name}\\b`, 'i'), `@keyframes ${scoped}`);
  css = css.replace(/transform-origin\s*:\s*[^;{}]+;?/gi, '');
  // Wave demos use a period-12 tile — coerce tiny -8px product shifts to one full period.
  if (/wave|pool|slosh|pour/i.test(kf.name || entryId || '')) {
    css = css.replace(/translateX\(\s*-?8px\s*\)/gi, 'translateX(-12px)');
  }
  const timing = animTimingFor(kf.name, kf.css);
  const demo = designatedAnimIcon(entryId || kf.name);
  // Unique clip ids inside SVG
  const svg = demo.svg.replace(/\bid="CLIP"/g, `id="${scoped}_clip"`)
    .replace(/url\(#CLIP\)/g, `url(#${scoped}_clip)`);
  const origin = demo.kind === 'pill' ? '32px 32px' : 'center';
  return [
    `<div class="stage stage--anim" data-stage="anim" data-anim="${kf.name}" data-demo="${demo.kind}">`,
    `<style>${css}
.${scoped}_host{width:88px;height:88px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:14px}
.${scoped}_host svg{width:72px;height:72px;overflow:visible;color:inherit}
.${scoped}_host .anim-target{animation:${scoped} ${timing};transform-box:fill-box;transform-origin:${origin}}
</style>`,
    `<div class="${scoped}_host" title="${demo.label}">${svg}</div>`,
    `<div class="anim-caption">${kf.name} · ${demo.label}</div>`,
    `</div>`,
  ].join('');
}

export function keyframesFromSources(...sources) {
  for (const src of sources) {
    const kf = extractCssKeyframes(src);
    if (kf) return kf;
  }
  return null;
}
