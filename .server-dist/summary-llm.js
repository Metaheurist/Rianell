/**
 * In-browser LLM for the AI summary note, suggest note, and dashboard MOTD (Transformers.js).
 * Model is chosen by device performance: small on low-end, base on medium/high for better quality.
 * Falls back to rule-based note if the model is unavailable or fails.
 */
(function () {
  'use strict';

  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
  try {
    var cachedPipeline = null;
    var cachedModelId = null;
    var summaryResultCache = null;
    var suggestResultCache = null;
    var MAX_SUMMARY_CACHE = 8;
    var MAX_SUGGEST_CACHE = 5;
    var MAX_CONTEXT_CHARS = 720;
    var MAX_SUGGEST_CONTEXT_CHARS = 280;
    var TIMEOUT_MS = 28000;
    var TIMEOUT_SUGGEST_MS = 12000;
    /** Covers Transformers.js import + model load + inference so the UI never waits forever on a hung getPipeline(). */
    var TIMEOUT_SUGGEST_TOTAL_MS = 90000;
    var TIMEOUT_MOTD_MS = 15000;
    var MAX_MOTD_CHARS = 160;
    var MODEL_SMALL = 'Xenova/flan-t5-small';
    var MODEL_BASE = 'Xenova/flan-t5-base';
    var MODEL_LARGE = 'Xenova/flan-t5-large';

    /**
     * Tier -> model id and Hugging Face link (for docs / debug).
     * Tier 5 uses base; large (Xenova/flan-t5-large) often returns 401 from HF, so we use base for top tier until large is public.
     * Links: tier1-2 https://huggingface.co/Xenova/flan-t5-small | tier3-4-5 https://huggingface.co/Xenova/flan-t5-base | (large) https://huggingface.co/Xenova/flan-t5-large
     */
    var LLM_TIER_MODELS = {
      tier1: {
        id: MODEL_SMALL,
        link: 'https://huggingface.co/Xenova/flan-t5-small'
      },
      tier2: {
        id: MODEL_SMALL,
        link: 'https://huggingface.co/Xenova/flan-t5-small'
      },
      tier3: {
        id: MODEL_BASE,
        link: 'https://huggingface.co/Xenova/flan-t5-base'
      },
      tier4: {
        id: MODEL_BASE,
        link: 'https://huggingface.co/Xenova/flan-t5-base'
      },
      tier5: {
        id: MODEL_BASE,
        link: 'https://huggingface.co/Xenova/flan-t5-base'
      }
    };

    /** Map tier (tier1..tier5) or size (small/base/large) to model id. Tier 1-2 -> small, 3-4-5 -> base (tier5 uses base; large may be gated on HF). */
    function llmTierOrSizeToModelId(tierOrSize) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "llmTierOrSizeToModelId", arguments) : undefined;
      try {
        if (tierOrSize === 'tier1' || tierOrSize === 'tier2' || tierOrSize === 'small') return MODEL_SMALL;
        if (tierOrSize === 'tier3' || tierOrSize === 'tier4' || tierOrSize === 'tier5' || tierOrSize === 'base' || tierOrSize === 'large') return MODEL_BASE;
        return MODEL_BASE;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /** Device class from PerformanceUtils (benchmark-aware) or single fallback when utils not loaded. */
    function getDeviceClassForModel() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "getDeviceClassForModel", arguments) : undefined;
      try {
        if (typeof window !== 'undefined' && window.PerformanceUtils && typeof window.PerformanceUtils.getDevicePerformanceClass === 'function') {
          return window.PerformanceUtils.getDevicePerformanceClass();
        }
        return 'medium';
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function getModelIdForDeviceClass(deviceClass) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "getModelIdForDeviceClass", arguments) : undefined;
      try {
        return deviceClass === 'low' ? MODEL_SMALL : MODEL_BASE;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Resolve preferred GPU device for pipeline from benchmark cache: 'webgpu' | 'webgl' | null (null = CPU/default).
     */
    function getPreferredDevice() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "getPreferredDevice", arguments) : undefined;
      try {
        if (typeof window === 'undefined' || !window.DeviceBenchmark || typeof window.DeviceBenchmark.getCachedResult !== 'function') return null;
        var cached = window.DeviceBenchmark.getCachedResult();
        if (!cached || !cached.gpu || !cached.gpu.available) return null;
        var backend = cached.gpu.backend;
        if (backend === 'webgpu') return 'webgpu';
        if (backend === 'webgl') return 'webgl';
        return null;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Resolve which model to use: 1) user override (appSettings.preferredLlmModelSize: tier1-tier5 or small/base/large),
     * 2) benchmark profile llmModelSize (tier1-tier5), 3) deviceClass fallback.
     */
    function getResolvedModelId() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "getResolvedModelId", arguments) : undefined;
      try {
        var prefs = typeof window !== 'undefined' && window.appSettings;
        var preferred = prefs && prefs.preferredLlmModelSize;
        if (preferred && preferred !== 'recommended') {
          return llmTierOrSizeToModelId(preferred);
        }
        if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
          var platformType = typeof window.DeviceBenchmark.getPlatformTypeCached === 'function' ? window.DeviceBenchmark.getPlatformTypeCached() : typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop';
          var tier = window.DeviceBenchmark.getPerformanceTier();
          var full = window.DeviceBenchmark.getFullProfile(platformType, tier, {});
          var size = full && full.llmModelSize;
          if (size) return llmTierOrSizeToModelId(size);
        }
        var deviceClass = typeof window !== 'undefined' && window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass ? window.PerformanceUtils.platform.deviceClass : getDeviceClassForModel();
        return getModelIdForDeviceClass(deviceClass);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    async function getPipeline() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "getPipeline", arguments) : undefined;
      try {
        var modelId = getResolvedModelId();
        if (cachedPipeline && cachedModelId === modelId) return cachedPipeline;
        cachedPipeline = null;
        cachedModelId = null;
        if (typeof window !== 'undefined' && window.rianellDebug && typeof console !== 'undefined' && console.debug) {
          console.debug('Summary LLM getPipeline: modelId=' + modelId + ', revision=main');
        }

        // Use 3.3.2 for stable WebGPU/WebGL device option; avoid 3.4.x due to "n.env is not a function" (flags_webgl.ts) with ONNX Runtime Web
        var mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2');
        // Do not set mod.env.allowLocalModels here; default is false in browser and avoids env API issues

        var device = getPreferredDevice();
        var pipelineOpts = {
          revision: 'main'
        };
        if (device) pipelineOpts.device = device;

        /**
         * Explicit dtype + brief console.warn filter while Transformers loads ONNX shards (avoids noisy
         * "dtype not specified" lines). dtype: fp32 on GPU, q8 on WASM/CPU in the browser.
         */
        async function runText2TextPipeline(pipelineModelId, opts) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "runText2TextPipeline", arguments) : undefined;
          try {
            var base = Object.assign({
              revision: 'main'
            }, opts || {});
            if (base.dtype == null) {
              base.dtype = base.device ? 'fp32' : 'q8';
            }
            var origWarn = console.warn;
            if (typeof console !== 'undefined' && console.warn) {
              console.warn = function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                try {
                  var s = arguments[0] != null ? String(arguments[0]) : '';
                  if (s.indexOf('dtype not specified') !== -1) return;
                  return origWarn.apply(console, arguments);
                } finally {
                  __rianellTraceExit(__rt);
                }
              };
            }
            try {
              return await mod.pipeline('text2text-generation', pipelineModelId, base);
            } finally {
              if (typeof console !== 'undefined') console.warn = origWarn;
            }
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        function loadPipeline(opts) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "loadPipeline", arguments) : undefined;
          try {
            return runText2TextPipeline(modelId, opts || {
              revision: 'main'
            });
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        try {
          cachedPipeline = await loadPipeline(pipelineOpts);
          cachedModelId = modelId;
          return cachedPipeline;
        } catch (e) {
          if (device && typeof console !== 'undefined' && console.warn) {
            console.warn('Summary LLM: GPU device ' + device + ' failed, falling back to CPU:', e.message || e);
          }
          try {
            pipelineOpts.device = undefined;
            delete pipelineOpts.device;
            cachedPipeline = await loadPipeline({
              revision: 'main'
            });
            cachedModelId = modelId;
            return cachedPipeline;
          } catch (eCpu) {
            if ((modelId === MODEL_BASE || modelId === MODEL_LARGE) && typeof console !== 'undefined' && console.warn) {
              console.warn('Summary LLM: ' + modelId + ' failed, retrying with smaller model:', eCpu.message || eCpu);
            }
            if (modelId === MODEL_LARGE) {
              try {
                cachedPipeline = await runText2TextPipeline(MODEL_BASE, {
                  revision: 'main'
                });
                cachedModelId = MODEL_BASE;
                return cachedPipeline;
              } catch (e2) {
                try {
                  cachedPipeline = await runText2TextPipeline(MODEL_SMALL, {
                    revision: 'main'
                  });
                  cachedModelId = MODEL_SMALL;
                  return cachedPipeline;
                } catch (e3) {
                  throw e3;
                }
              }
            }
            if (modelId === MODEL_BASE) {
              try {
                cachedPipeline = await runText2TextPipeline(MODEL_SMALL, {
                  revision: 'main'
                });
                cachedModelId = MODEL_SMALL;
                return cachedPipeline;
              } catch (e2) {
                throw e2;
              }
            }
            throw eCpu;
          }
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function simpleHash(s) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "simpleHash", arguments) : undefined;
      try {
        if (typeof s !== 'string' || s.length === 0) return '0';
        var h = 5381;
        for (var i = 0; i < s.length; i++) {
          h = (h << 5) + h + s.charCodeAt(i);
        }
        return (h >>> 0).toString(36);
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function stripMarkdown(s) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "stripMarkdown", arguments) : undefined;
      try {
        return (s || '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function metricLabel(metric) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "metricLabel", arguments) : undefined;
      try {
        return (metric || '').replace(/([A-Z])/g, ' $1').replace(/^./, function (c) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
          try {
            return c.toUpperCase();
          } finally {
            __rianellTraceExit(__rt);
          }
        }).trim();
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Build data-rich context: trends snapshot, flare count, then summary/insights/advice.
     * Keeps the model light by feeding clear, factual bullets so it can be concise and insightful.
     */
    function buildSummaryContext(analysis, options) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "buildSummaryContext", arguments) : undefined;
      try {
        var parts = [];
        var logs = options && options.logs ? options.logs : [];
        var dayCount = options && options.dayCount || logs.length;

        // 1) Data snapshot: period + flares
        var flareCount = logs.filter(function (l) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
          try {
            return l.flare === 'Yes';
          } finally {
            __rianellTraceExit(__rt);
          }
        }).length;
        var dataLine = dayCount + ' day(s) of data.';
        if (flareCount > 0 && dayCount >= 1) {
          dataLine += ' Flares: ' + flareCount + ' day(s).';
        }
        parts.push(dataLine);

        // 2) Trend bullets (improving / stable / worsening) from analysis.trends
        var trends = analysis.trends || {};
        var improving = [];
        var worsening = [];
        var stable = [];
        Object.keys(trends).forEach(function (metric) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
          try {
            var t = trends[metric];
            if (!t || !t.regression) return;
            var sig = t.regression.normalizedSignificance;
            if (sig != null && sig < 0.5) return;
            var dir = t.regression && t.regression.direction || t.predictedStatus;
            var name = metricLabel(metric);
            if (dir === 'improving') improving.push(name);else if (dir === 'worsening') worsening.push(name);else if (dir === 'stable') stable.push(name);
          } finally {
            __rianellTraceExit(__rt);
          }
        });
        if (improving.length) parts.push('Improving: ' + improving.slice(0, 4).join(', ') + '.');
        if (worsening.length) parts.push('Worsening: ' + worsening.slice(0, 4).join(', ') + '.');
        if (stable.length && parts.length <= 2) parts.push('Stable: ' + stable.slice(0, 3).join(', ') + '.');

        // 3) Narrative summary + top insights + one advice
        if (analysis.summary && analysis.summary.trim()) {
          parts.push(stripMarkdown(analysis.summary));
        }
        if (analysis.prioritisedInsights && analysis.prioritisedInsights.length > 0) {
          analysis.prioritisedInsights.slice(0, 3).forEach(function (insight) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
            try {
              parts.push(stripMarkdown(insight));
            } finally {
              __rianellTraceExit(__rt);
            }
          });
        }
        if (analysis.advice && analysis.advice.length > 0) {
          parts.push(stripMarkdown(analysis.advice[0]));
        }
        // Optional: one line from stressors or symptoms if present (enrich without bloating)
        if (analysis.stressorAnalysis && analysis.stressorAnalysis.topStressors && analysis.stressorAnalysis.topStressors.length > 0) {
          var top = analysis.stressorAnalysis.topStressors[0];
          if (top && top.name && !parts.some(function (p) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
            try {
              return p.indexOf(top.name) >= 0;
            } finally {
              __rianellTraceExit(__rt);
            }
          })) {
            parts.push('Top stressor: ' + (top.name || '').trim() + (top.pct != null ? ' (' + Math.round(top.pct) + '%).' : '.'));
          }
        }
        var text = parts.join(' ');
        return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    function stripTrailingIncompleteSentence(text) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "stripTrailingIncompleteSentence", arguments) : undefined;
      try {
        if (!text || text.length < 20) return text;
        var last = text.lastIndexOf('.');
        if (last === -1) return text;
        return text.slice(0, last + 1).trim();
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Generate a short, data-informed summary (2–3 sentences) for the patient.
     * Result is cached by context hash so the same analysis/options return cached text (only update on change).
     */
    async function generateSummaryWithLLM(analysis, options, fallbackNote) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "generateSummaryWithLLM", arguments) : undefined;
      try {
        var context = buildSummaryContext(analysis, options);
        if (!context || context.length < 10) return fallbackNote;
        var contextHash = simpleHash(context);
        if (!summaryResultCache) summaryResultCache = new Map();
        var cached = summaryResultCache.get(contextHash);
        if (cached != null) return cached;
        var prompt = 'Summarise in 2 short sentences for the patient. Use only the data below. Mention 1-2 specific findings (e.g. trends or flares). Be clear and encouraging. Data: ' + context;
        try {
          var pipe = await getPipeline();
          var run = pipe(prompt, {
            max_new_tokens: 90,
            do_sample: false,
            truncation: true
          });
          var timeoutPromise = new Promise(function (_, reject) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
            try {
              setTimeout(function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                try {
                  reject(new Error('Summary LLM timeout'));
                } finally {
                  __rianellTraceExit(__rt);
                }
              }, TIMEOUT_MS);
            } finally {
              __rianellTraceExit(__rt);
            }
          });
          var out = await Promise.race([run, timeoutPromise]);
          var text = out && out[0] && out[0].generated_text ? out[0].generated_text.trim() : '';
          if (text && text.length > 15) {
            text = stripTrailingIncompleteSentence(text);
            if (summaryResultCache.size >= MAX_SUMMARY_CACHE) {
              var firstKey = summaryResultCache.keys().next().value;
              if (firstKey != null) summaryResultCache.delete(firstKey);
            }
            summaryResultCache.set(contextHash, text);
            return text;
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Summary LLM failed, using rule-based note:', e.message || e);
          }
          if (typeof window !== 'undefined' && window.rianellDebug && typeof console !== 'undefined' && console.debug) {
            console.debug('Summary LLM: using rule-based fallback');
          }
        }
        return fallbackNote;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Build short context for suggest note: today's metrics vs recent 14-day average.
     * Metrics: backPain, stiffness, fatigue, sleep, jointPain, mobility, dailyFunction, swelling, mood, irritability.
     */
    function buildSuggestContext(todayStub, recentLogs) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "buildSuggestContext", arguments) : undefined;
      try {
        var metrics = ['backPain', 'stiffness', 'fatigue', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];
        var recent = (recentLogs || []).filter(function (l) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
          try {
            return l.date !== (todayStub && todayStub.date);
          } finally {
            __rianellTraceExit(__rt);
          }
        }).slice(-14);
        if (recent.length < 2) return '';
        var todayParts = [];
        var avgParts = [];
        metrics.forEach(function (m) {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
          try {
            var v = todayStub[m];
            if (v === undefined || v === null || v === '') return;
            var num = m === 'weight' ? parseFloat(v) : parseInt(v, 10) || 0;
            if (isNaN(num)) return;
            var vals = recent.map(function (l) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
              try {
                return m === 'weight' ? parseFloat(l[m]) : parseInt(l[m], 10) || 0;
              } finally {
                __rianellTraceExit(__rt);
              }
            }).filter(function (x) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
              try {
                return !isNaN(x);
              } finally {
                __rianellTraceExit(__rt);
              }
            });
            if (vals.length < 2) return;
            var avg = vals.reduce(function (a, b) {
              var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
              try {
                return a + b;
              } finally {
                __rianellTraceExit(__rt);
              }
            }, 0) / vals.length;
            var name = metricLabel(m);
            todayParts.push(name + ' ' + (m === 'weight' ? num.toFixed(1) : num));
            avgParts.push(name + ' ' + avg.toFixed(1));
          } finally {
            __rianellTraceExit(__rt);
          }
        });
        if (todayParts.length < 2) return '';
        var line1 = 'Today: ' + todayParts.slice(0, 5).join(', ') + '.';
        var line2 = 'Recent 14-day average: ' + avgParts.slice(0, 5).join(', ') + '.';
        var flare = todayStub.flare === 'Yes' ? ' Flare: Yes.' : ' Flare: No.';
        var text = line1 + ' ' + line2 + flare;
        return text.length > MAX_SUGGEST_CONTEXT_CHARS ? text.slice(0, MAX_SUGGEST_CONTEXT_CHARS) : text;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Generate one short sentence for a daily log note using the same pipeline. Resolves with fallbackText on failure.
     * Result is cached by context hash so the same context returns cached text (only update on change).
     */
    async function generateSuggestNoteWithLLM(contextString, fallbackText) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "generateSuggestNoteWithLLM", arguments) : undefined;
      try {
        if (!contextString || contextString.length < 10) return fallbackText || '';
        var contextHash = simpleHash(contextString);
        if (!suggestResultCache) suggestResultCache = new Map();
        var cached = suggestResultCache.get(contextHash);
        if (cached != null) return cached;
        var prompt = 'Write one short sentence for a daily log note. Use only the data below. Compare today to average. Data: ' + contextString;
        async function runSuggest() {
          var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "runSuggest", arguments) : undefined;
          try {
            try {
              var pipe = await getPipeline();
              var run = pipe(prompt, {
                max_new_tokens: 48,
                do_sample: false,
                truncation: true
              });
              var timeoutPromise = new Promise(function (_, reject) {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                try {
                  setTimeout(function () {
                    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                    try {
                      reject(new Error('Suggest note LLM timeout'));
                    } finally {
                      __rianellTraceExit(__rt);
                    }
                  }, TIMEOUT_SUGGEST_MS);
                } finally {
                  __rianellTraceExit(__rt);
                }
              });
              var out = await Promise.race([run, timeoutPromise]);
              var text = out && out[0] && out[0].generated_text ? out[0].generated_text.trim() : '';
              if (text && text.length > 8) {
                text = stripTrailingIncompleteSentence(text);
                if (suggestResultCache.size >= MAX_SUGGEST_CACHE) {
                  var firstKey = suggestResultCache.keys().next().value;
                  if (firstKey != null) suggestResultCache.delete(firstKey);
                }
                suggestResultCache.set(contextHash, text);
                return text;
              }
            } catch (e) {
              if (typeof console !== 'undefined' && console.warn) {
                console.warn('Suggest note LLM failed, using rule-based:', e.message || e);
              }
            }
            return fallbackText || '';
          } finally {
            __rianellTraceExit(__rt);
          }
        }
        try {
          var totalReject = new Promise(function (_, reject) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
            try {
              setTimeout(function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                try {
                  reject(new Error('Suggest note total timeout'));
                } finally {
                  __rianellTraceExit(__rt);
                }
              }, TIMEOUT_SUGGEST_TOTAL_MS);
            } finally {
              __rianellTraceExit(__rt);
            }
          });
          return await Promise.race([runSuggest(), totalReject]);
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Suggest note LLM failed, using rule-based:', e.message || e);
          }
          return fallbackText || '';
        }
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * Normalize MOTD: one line, no quotes, length cap. Not cached - each call can differ (fresh nonce in prompt + sampling).
     */
    function sanitizeMotdText(raw) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "sanitizeMotdText", arguments) : undefined;
      try {
        if (!raw || typeof raw !== 'string') return '';
        var t = raw.replace(/\s+/g, ' ').trim();
        t = t.replace(/^["'“”]+|["'“”]+$/g, '').trim();
        if (t.length > MAX_MOTD_CHARS) {
          var cut = t.slice(0, MAX_MOTD_CHARS);
          var lastSpace = cut.lastIndexOf(' ');
          if (lastSpace > 40) cut = cut.slice(0, lastSpace);
          t = cut.trim();
          if (t.length > 0 && !/[.!?]$/.test(t)) t += '…';
        }
        return t;
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /**
     * One short motivational line for the dashboard header. No user names. Different on each full load (no cache; random theme + time in prompt; sampling).
     * Resolves with fallbackText on failure or unusable output.
     */
    async function generateMotdWithLLM(fallbackText) {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "generateMotdWithLLM", arguments) : undefined;
      try {
        var themes = ['gentle progress', 'self-care', 'small wins', 'patience', 'renewal', 'inner strength', 'balance', 'hope', 'showing up for yourself', 'one step at a time', 'self-compassion', 'rest as strength', 'listening inward', 'tiny habits', 'second chances', 'seasonal rhythm', 'morning light', 'evening wind-down', 'weekend reset', 'midweek steadiness', 'body neutrality', 'moving without pressure', 'eating with kindness', 'hydration as care', 'sleep as repair', 'stress as signal', 'anxiety with softness', 'fatigue without blame', 'chronic illness grace', 'flare-day realism', 'good enough medicine', 'asking for help', 'boundaries that heal', 'joy in small rituals', 'creativity for calm', 'music and mood', 'outdoor air', 'stretching gently', 'posture with ease', 'breath as anchor', 'gratitude without toxic positivity', 'honest logging', 'data without obsession', 'curiosity over criticism', 'forgiving yesterday', 'trusting tomorrow lightly', 'community care', 'family balance', 'work-life oxygen', 'digital breaks', 'celebrating stillness', 'permission to pause', 'courage in quiet choices', 'resilience after setbacks', 'identity beyond symptoms', 'dignity in difficulty', 'play and lightness', 'humour that heals', 'colour and comfort', 'fresh starts'];
        var theme = themes[Math.floor(Math.random() * themes.length)];
        var nonce = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        var prompt = 'Write one short motivational sentence for a health tracking app. Address the reader in a warm, supportive way. ' + 'Do not use anyone\'s name. No medical advice. No quotation marks. Max 22 words. Theme: ' + theme + '. Unique: ' + nonce + '.';
        try {
          var pipe = await getPipeline();
          var run = pipe(prompt, {
            max_new_tokens: 56,
            do_sample: true,
            temperature: 0.92,
            top_p: 0.93,
            truncation: true
          });
          var timeoutPromise = new Promise(function (_, reject) {
            var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
            try {
              setTimeout(function () {
                var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
                try {
                  reject(new Error('MOTD LLM timeout'));
                } finally {
                  __rianellTraceExit(__rt);
                }
              }, TIMEOUT_MOTD_MS);
            } finally {
              __rianellTraceExit(__rt);
            }
          });
          var out = await Promise.race([run, timeoutPromise]);
          var text = out && out[0] && out[0].generated_text ? String(out[0].generated_text).trim() : '';
          text = sanitizeMotdText(text);
          if (text.length >= 12 && text.length <= MAX_MOTD_CHARS + 20) {
            text = stripTrailingIncompleteSentence(text);
            text = sanitizeMotdText(text);
            if (text.length >= 12) return text;
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('MOTD LLM failed, using default title:', e.message || e);
          }
        }
        return fallbackText || '';
      } finally {
        __rianellTraceExit(__rt);
      }
    }

    /** Clear cached pipeline so the next use loads the model from current preference (e.g. after changing On-device AI model in Settings). */
    function clearSummaryLLMCache() {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "clearSummaryLLMCache", arguments) : undefined;
      try {
        cachedPipeline = null;
        cachedModelId = null;
      } finally {
        __rianellTraceExit(__rt);
      }
    }
    window.generateSummaryWithLLM = generateSummaryWithLLM;
    window.generateSuggestNoteWithLLM = generateSuggestNoteWithLLM;
    window.generateMotdWithLLM = generateMotdWithLLM;
    window.buildSuggestContext = buildSuggestContext;
    /** Tier -> { id, link } for all tiers (for debug / docs). */
    window.LLM_TIER_MODELS = LLM_TIER_MODELS;
    /** Preload the pipeline so the app can wait until AI is ready before revealing the UI. Returns a Promise that resolves when the model is loaded. */
    window.preloadSummaryLLM = function () {
      var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("summary-llm.js", "anonymous", arguments) : undefined;
      try {
        return getPipeline();
      } finally {
        __rianellTraceExit(__rt);
      }
    };
    window.clearSummaryLLMCache = clearSummaryLLMCache;
  } finally {
    __rianellTraceExit(__rt);
  }
})();