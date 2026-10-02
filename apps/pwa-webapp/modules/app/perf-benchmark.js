/**
 * Performance benchmark results modal and details view.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { benchmarkTestLabel, tUi } from './i18n-theme.js';
import { Logger } from './logger.js';
import { escapeAttr, escapeHTML } from './dom-safety.js';
import { closeSettingsModalIfOpen, showAlertModal } from './modal-host.js';

// ============================================
// Performance benchmark modal
// ============================================
let _perfBenchmarkEscapeHandler = null;

function closePerfBenchmarkModal() {
  if (_perfBenchmarkEscapeHandler) {
    document.removeEventListener('keydown', _perfBenchmarkEscapeHandler);
    _perfBenchmarkEscapeHandler = null;
  }
  const overlay = document.getElementById('perfBenchmarkOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    overlay.style.removeProperty('z-index');
    document.body.classList.remove('modal-active');
    document.body.style.overflow = '';
  }
}

function openPerfBenchmarkModal(options) {
  const overlay = document.getElementById('perfBenchmarkOverlay');
  const titleEl = document.getElementById('perfBenchmarkTitle');
  const summaryEl = document.getElementById('perfBenchmarkSummary');
  const barsEl = document.getElementById('perfBenchmarkBars');
  const sparkEl = document.getElementById('perfBenchmarkSparkline');
  const statsEl = document.getElementById('perfBenchmarkStats');
  const profileEl = document.getElementById('perfBenchmarkProfile');
  const continueBtn = document.getElementById('perfBenchmarkContinueBtn');
  const closeBtn = overlay ? overlay.querySelector('.modal-close') : null;
  if (!overlay || !summaryEl || !barsEl || !profileEl || !continueBtn) {
    if (typeof Logger !== 'undefined' && Logger.warn) {
      Logger.warn('Performance benchmark modal: missing DOM nodes');
    }
    return false;
  }

  const mode = options && options.mode ? options.mode : 'view';
  const result = options && options.result ? options.result : null;

  // Close settings modal if open
  closeSettingsModalIfOpen();

  if (titleEl) titleEl.textContent = mode === 'firstRun' ? tUi('benchmark.title') : tUi('benchmark.titleLastRun');

  const platformType = result && result.platformType ? result.platformType : 'unknown';
  const tier = result && typeof result.tier === 'number' ? result.tier : null;
  const repeats = result && typeof result.repeats === 'number' ? result.repeats : null;
  const deviceClass = (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getLegacyDeviceClass === 'function' && tier != null)
    ? window.DeviceBenchmark.getLegacyDeviceClass(tier)
    : 'medium';

  const env = result && result.env ? result.env : {};
  const full = (tier != null && typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getFullProfile === 'function')
    ? window.DeviceBenchmark.getFullProfile(platformType, tier, { saveData: !!env.saveData, prefersReducedMotion: !!env.prefersReducedMotion })
    : null;
  const llmSize = (full && full.llmModelSize) ? full.llmModelSize : (deviceClass === 'low' ? 'tier1' : deviceClass === 'high' ? 'tier5' : 'tier3');
  const llmDisplay = (llmSize && String(llmSize).indexOf('tier') === 0) ? 'Tier ' + String(llmSize).replace('tier', '') : llmSize;

  summaryEl.textContent = tier == null
    ? tUi('benchmark.noResult')
    : tUi('benchmark.summary', { platform: platformType, tier: tier, deviceClass: deviceClass, model: llmDisplay });

  const aiLineEl = document.getElementById('perfBenchmarkAiLine');
  if (aiLineEl) aiLineEl.textContent = tier != null ? (llmDisplay ? tUi('benchmark.aiLine', { model: llmDisplay }) : '') : '';

  const gpuLineEl = document.getElementById('perfBenchmarkGpuLine');
  if (gpuLineEl) {
    var gpu = result && result.gpu ? result.gpu : null;
    if (gpu && gpu.available && gpu.backend && gpu.backend !== 'none') {
      var gpuBackendLabel = gpu.backend === 'webgpu' ? 'WebGPU' : gpu.backend === 'webgl' ? 'WebGL' : gpu.backend;
      gpuLineEl.textContent = tUi('benchmark.gpuAvailable', { backend: gpuBackendLabel });
    } else {
      gpuLineEl.textContent = tier != null ? tUi('benchmark.gpuUnavailable') : '';
    }
  }

  // Bars: per-test medianMs (smaller is better → longer bar)
  barsEl.innerHTML = '';
  const tests = result && Array.isArray(result.tests) ? result.tests : [];
  if (tests.length) {
    const msVals = tests.map(t => (typeof t.medianMs === 'number' ? t.medianMs : (typeof t.meanMs === 'number' ? t.meanMs : 0))).filter(v => v > 0);
    const minMs = msVals.length ? Math.min.apply(null, msVals) : 0;
    const maxMs = msVals.length ? Math.max.apply(null, msVals) : 0;
    tests.forEach(t => {
      const ms = (typeof t.medianMs === 'number' && t.medianMs > 0) ? t.medianMs : (typeof t.meanMs === 'number' ? t.meanMs : 0);
      const denom = (maxMs - minMs) || 1;
      const norm = ms > 0 ? (1 - ((ms - minMs) / denom)) : 0;
      const widthPct = Math.max(6, Math.min(100, Math.round(norm * 100)));

      const row = document.createElement('div');
      row.className = 'perf-benchmark-bar-row';
      const labelText = benchmarkTestLabel(t);
      row.innerHTML = `
        <div class="perf-benchmark-bar-label" title="${escapeAttr(labelText)}">${escapeHTML(labelText)}</div>
        <div class="perf-benchmark-bar-track"><div class="perf-benchmark-bar-fill" style="width:${widthPct}%;"></div></div>
        <div class="perf-benchmark-bar-value">${ms ? ms.toFixed(1) + 'ms' : '-'}</div>
      `;
      barsEl.appendChild(row);
    });
  } else {
    const empty = document.createElement('div');
    empty.style.opacity = '0.8';
    empty.textContent = tUi('benchmark.noPerTestBreakdown');
    barsEl.appendChild(empty);
  }

  // Stats + sparkline (CPU msPer200k samples)
  if (statsEl) statsEl.innerHTML = '';
  const cpu = result && result.cpu ? result.cpu : null;
  const cpuSamples = cpu && Array.isArray(cpu.msPer200kSamples) ? cpu.msPer200kSamples : [];
  if (statsEl && tier != null) {
    // Use cached env but fill missing fields from current device (so old cache still shows live OS/cores/etc.)
    const env = result && result.env ? Object.assign({}, result.env) : {};
    const dm = (typeof window !== 'undefined' && window.DeviceModule && window.DeviceModule.platform) ? window.DeviceModule.platform : null;
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    if (env.cores == null) env.cores = (dm && dm.cores != null) ? dm.cores : (typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null);
    if (env.deviceMemory == null && dm && dm.deviceMemory != null) env.deviceMemory = dm.deviceMemory;
    if (!env.estimatedMemoryBucket && dm && dm.estimatedMemoryBucket) env.estimatedMemoryBucket = dm.estimatedMemoryBucket;
    if (!env.osName && dm && dm.osName) env.osName = dm.osName;
    if (!env.osVersion && dm && dm.osVersion) env.osVersion = dm.osVersion;
    if (!env.deviceType && dm && dm.deviceType) env.deviceType = dm.deviceType;
    if (!env.deviceVendor && dm && dm.deviceVendor) env.deviceVendor = dm.deviceVendor;
    if (!env.deviceModel && dm && dm.deviceModel) env.deviceModel = dm.deviceModel;
    if (!env.cpuArchitecture && dm && dm.cpuArchitecture) env.cpuArchitecture = dm.cpuArchitecture;
    const osDisplay = (env.osName && env.osVersion) ? `${env.osName} ${env.osVersion}` : (env.osName || env.osVersion || '-');
    const deviceDisplay = [env.deviceVendor, env.deviceModel].filter(Boolean).join(' ') || (env.deviceType || '-');
    const memoryDisplay = env.deviceMemory != null ? String(env.deviceMemory) + ' GB' : (env.estimatedMemoryBucket ? `estimated: ${env.estimatedMemoryBucket}` : '-');
    const kv = [
      [tUi('benchmark.stat.class'), deviceClass],
      [tUi('benchmark.stat.repeats'), repeats != null ? String(repeats) : '-'],
      [tUi('benchmark.stat.cores'), env.cores != null ? String(env.cores) : '-'],
      [tUi('benchmark.stat.memory'), memoryDisplay],
      [tUi('benchmark.stat.os'), osDisplay],
      [tUi('benchmark.stat.device'), deviceDisplay],
      [tUi('benchmark.stat.cpu'), env.cpuArchitecture || '-']
    ];
    kv.forEach(pair => {
      const div = document.createElement('div');
      div.innerHTML = `<span>${pair[0]}</span><span>${pair[1]}</span>`;
      statsEl.appendChild(div);
    });
  }

  if (sparkEl && sparkEl.getContext) {
    const ctx = sparkEl.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, sparkEl.width, sparkEl.height);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, sparkEl.width, sparkEl.height);
      ctx.strokeStyle = 'rgba(76,175,80,0.95)';
      ctx.lineWidth = 2;

      if (cpuSamples && cpuSamples.length >= 2) {
        const pad = 10;
        const w = sparkEl.width - pad * 2;
        const h = sparkEl.height - pad * 2;
        const minV = Math.min.apply(null, cpuSamples);
        const maxV = Math.max.apply(null, cpuSamples);
        const denom = (maxV - minV) || 1;
        ctx.beginPath();
        for (let i = 0; i < cpuSamples.length; i++) {
          const x = pad + (i / (cpuSamples.length - 1)) * w;
          const y = pad + (1 - ((cpuSamples[i] - minV) / denom)) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(76,175,80,0.18)';
        ctx.lineTo(pad + w, pad + h);
        ctx.lineTo(pad, pad + h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(224,242,241,0.7)';
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        ctx.fillText(tUi('benchmark.noStabilitySamples'), 14, 26);
      }
    }
  }

  const gpuSparkEl = document.getElementById('perfBenchmarkGpuSparkline');
  const gpuStatsEl = document.getElementById('perfBenchmarkGpuStats');
  const gpuSamples = result && result.gpu && Array.isArray(result.gpu.scoreSamples) ? result.gpu.scoreSamples : [];
  const gpuAvailable = result && result.gpu && result.gpu.available && result.gpu.backend && result.gpu.backend !== 'none';
  if (gpuStatsEl) {
    gpuStatsEl.innerHTML = '';
    if (gpuAvailable) {
      const backendLabel = result.gpu.backend === 'webgpu' ? 'WebGPU' : result.gpu.backend === 'webgl' ? 'WebGL' : result.gpu.backend;
      const meanMs = gpuSamples.length ? (gpuSamples.reduce((a, b) => a + b, 0) / gpuSamples.length).toFixed(2) : '-';
      const kv = [
        [tUi('benchmark.stat.backend'), backendLabel],
        [tUi('benchmark.stat.samples'), gpuSamples.length ? String(gpuSamples.length) : '0'],
        [tUi('benchmark.stat.mean'), meanMs !== '-' ? meanMs + ' ms' : '-']
      ];
      kv.forEach(pair => {
        const div = document.createElement('div');
        div.innerHTML = `<span>${pair[0]}</span><span>${pair[1]}</span>`;
        gpuStatsEl.appendChild(div);
      });
      if (gpuSamples.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'perf-benchmark-gpu-hint';
        hint.style.cssText = 'margin-top:6px;font-size:0.8rem;opacity:0.85;';
        hint.textContent = tUi('benchmark.clearCacheHint');
        gpuStatsEl.appendChild(hint);
      }
    } else {
      const div = document.createElement('div');
      div.innerHTML = '<span>GPU</span><span>' + tUi('common.not.available') + '</span>';
      gpuStatsEl.appendChild(div);
    }
  }
  if (gpuSparkEl && gpuSparkEl.getContext) {
    const ctx = gpuSparkEl.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, gpuSparkEl.width, gpuSparkEl.height);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, gpuSparkEl.width, gpuSparkEl.height);
      ctx.strokeStyle = 'rgba(76,175,80,0.95)';
      ctx.lineWidth = 2;
      if (gpuSamples.length >= 2) {
        const pad = 10;
        const w = gpuSparkEl.width - pad * 2;
        const h = gpuSparkEl.height - pad * 2;
        const minV = Math.min.apply(null, gpuSamples);
        const maxV = Math.max.apply(null, gpuSamples);
        const denom = (maxV - minV) || 1;
        ctx.beginPath();
        for (let i = 0; i < gpuSamples.length; i++) {
          const x = pad + (i / (gpuSamples.length - 1)) * w;
          const y = pad + (1 - ((gpuSamples[i] - minV) / denom)) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(76,175,80,0.18)';
        ctx.lineTo(pad + w, pad + h);
        ctx.lineTo(pad, pad + h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(224,242,241,0.7)';
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        const msg = !gpuAvailable ? tUi('benchmark.gpuNotAvailable') : gpuSamples.length === 0 ? tUi('benchmark.noGpuStabilitySamples') : tUi('benchmark.noStabilitySamples');
        ctx.fillText(msg, 14, 26);
      }
    }
  }

  // Profile summary (key settings) - use full profile already computed above when available
  let profileSummary = null;
  try {
    if (full && tier != null) {
      profileSummary = {
        deviceClass: full.deviceClass,
        chartMaxPoints: full.chartMaxPoints,
        maxChartPoints: full.maxChartPoints,
        chartAnimation: full.chartAnimation,
        enableChartPreload: full.enableChartPreload,
        chartPreloadDelayMs: full.chartPreloadDelayMs,
        enableAIPreload: full.enableAIPreload,
        aiPreloadDelayMs: full.aiPreloadDelayMs,
        useWorkers: full.useWorkers,
        demoDataDays: full.demoDataDays,
        loadTimeoutMs: full.loadTimeoutMs,
        llmModelSize: full.llmModelSize,
        storageBatchDelayMs: full.storageBatchDelayMs,
        lazyChartStaggerMs: full.lazyChartStaggerMs,
        domCacheTtlMs: full.domCacheTtlMs
      };
    }
  } catch (e) {}
  profileEl.textContent = profileSummary ? JSON.stringify(profileSummary, null, 2) : tUi('benchmark.profileNotAvailable');

  // Buttons and close behavior
  if (continueBtn) {
    continueBtn.textContent = mode === 'firstRun' ? tUi('common.continue') : tUi('common.close');
    continueBtn.onclick = function () {
      closePerfBenchmarkModal();
      if (options && typeof options.onContinue === 'function') options.onContinue();
    };
  }
  if (closeBtn) closeBtn.style.display = (mode === 'firstRun') ? 'none' : '';

  overlay.onclick = function (e) {
    if (e.target !== overlay) return;
    if (mode !== 'firstRun') closePerfBenchmarkModal();
  };
  _perfBenchmarkEscapeHandler = function (e) {
    if (e.key === 'Escape') {
      if (mode !== 'firstRun') closePerfBenchmarkModal();
      document.removeEventListener('keydown', _perfBenchmarkEscapeHandler);
      _perfBenchmarkEscapeHandler = null;
    }
  };
  document.addEventListener('keydown', _perfBenchmarkEscapeHandler);

  /* Above #loadingOverlay (z-index 99999) so first-run benchmark is never stuck behind it */
  overlay.style.zIndex = '100000';
  overlay.style.display = 'block';
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  document.body.classList.add('modal-active');
  document.body.style.overflow = 'hidden';
  return true;
}

function openBenchmarkDetails() {
  const cached = (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getCachedResult === 'function')
    ? window.DeviceBenchmark.getCachedResult()
    : null;
  if (!cached) {
    showAlertModal(tUi('common.no.cached.benchmark.found.run.the.benchm'), tUi('settings.performance.title'));
    return;
  }
  openPerfBenchmarkModal({ mode: 'view', result: cached });
}

export { closePerfBenchmarkModal, openBenchmarkDetails };
