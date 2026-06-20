var RianellAIEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/ai-engine/src/index.mjs
  var index_exports = {};
  __export(index_exports, {
    AIEngine: () => AIEngine,
    BALANCE_RADAR_BUILTIN: () => BALANCE_RADAR_BUILTIN,
    CONDITION_ANALYSIS_PACKS: () => CONDITION_ANALYSIS_PACKS,
    CYCLE_PHASE_COLORS: () => CYCLE_PHASE_COLORS,
    analyzeHealthMetrics: () => analyzeHealthMetrics,
    applyConditionPack: () => applyConditionPack,
    buildBalanceRadarData: () => buildBalanceRadarData,
    buildCorrelationCards: () => buildCorrelationCards,
    buildCyclePhaseBands: () => buildCyclePhaseBands,
    buildFlarePostMortem: () => buildFlarePostMortem,
    buildInsightWhy: () => buildInsightWhy,
    buildPacingChartSeries: () => buildPacingChartSeries,
    buildTodayPacingBudget: () => buildTodayPacingBudget,
    buildWeeklyDigest: () => buildWeeklyDigest,
    collectInsightCandidates: () => collectInsightCandidates,
    collectInsightCandidatesFromSummary: () => collectInsightCandidatesFromSummary,
    compareChartPeriods: () => compareChartPeriods,
    compareTreatmentWindows: () => compareTreatmentWindows,
    computeTriggerHypotheses: () => computeTriggerHypotheses,
    correlationConfidenceLevel: () => correlationConfidenceLevel,
    cycleBandsToApexAnnotations: () => cycleBandsToApexAnnotations,
    detectMetricAnomalies: () => detectMetricAnomalies,
    exportAnalysisJsonForResearch: () => exportAnalysisJsonForResearch,
    filterLogsByRange: () => filterLogsByRange,
    generateAnalysisNote: () => generateAnalysisNote,
    predictFutureValues: () => predictFutureValues,
    rankInsightItems: () => rankInsightItems,
    rankNeuralAnalysisInsights: () => rankNeuralAnalysisInsights,
    rankPrioritisedInsights: () => rankPrioritisedInsights,
    rankPrioritisedInsightsFromSummary: () => rankPrioritisedInsightsFromSummary,
    runDeterministicAnalysis: () => runDeterministicAnalysis,
    suggestLogNote: () => suggestLogNote,
    summarizeLogsForAi: () => summarizeLogsForAi
  });

  // packages/ai-engine/src/summarize.mjs
  function tr(translate, key, params, fallback) {
    if (typeof translate === "function") {
      const result = translate(key, params);
      if (typeof result === "string" && result !== key) return result;
    }
    return fallback;
  }
  function toDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = /* @__PURE__ */ new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function mean(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function topItems(logs, key, limit = 3) {
    const counts = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      const list = log[key];
      if (!Array.isArray(list)) return;
      list.forEach((x) => {
        if (typeof x !== "string") return;
        const item = x.trim();
        if (!item) return;
        counts.set(item, (counts.get(item) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([name, count]) => `${name} (${count})`);
  }
  function pearson(xs, ys) {
    if (xs.length !== ys.length || xs.length < 3) return null;
    const n = xs.length;
    const avgX = xs.reduce((a, b) => a + b, 0) / n;
    const avgY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - avgX;
      const dy = ys[i] - avgY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return null;
    return num / Math.sqrt(denX * denY);
  }
  function filterLogsByRange(logs, range) {
    if (range === "all") return logs;
    const days = typeof range === "number" ? range : 30;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return logs.filter((log) => {
      if (!log || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return false;
      const d = toDate(log.date);
      return !!d && d >= start && d <= today;
    });
  }
  function summarizeLogsForAi(logs, range = 30, options = {}) {
    const translate = options?.translate;
    const selected = filterLogsByRange(logs, range);
    const rangeLabel = range === "all" ? "All time" : `Last ${range} days`;
    const flareDays = selected.filter((x) => x.flare === "Yes").length;
    const mood = selected.map((x) => x.mood).filter((x) => x != null);
    const sleep = selected.map((x) => x.sleep).filter((x) => x != null);
    const fatigue = selected.map((x) => x.fatigue).filter((x) => x != null);
    const moodAvg = mean(mood);
    const sleepAvg = mean(sleep);
    const fatigueAvg = mean(fatigue);
    const daysWithFood = selected.filter((x) => {
      const f = x.food;
      if (!f || typeof f !== "object") return false;
      return ["breakfast", "lunch", "dinner", "snack"].some(
        (k) => Array.isArray(f[k]) && f[k].length > 0
      );
    }).length;
    const daysWithExercise = selected.filter((x) => Array.isArray(x.exercise) && x.exercise.length > 0).length;
    const whatYouLogged = [
      `${selected.length} logged day(s) in ${rangeLabel.toLowerCase()}`,
      `${flareDays} flare day(s)`,
      `${daysWithFood} day(s) with food entries`,
      `${daysWithExercise} day(s) with exercise entries`
    ];
    const howYouAreDoing = [];
    if (moodAvg != null) howYouAreDoing.push(`Mood average: ${moodAvg.toFixed(1)} / 10`);
    if (sleepAvg != null) howYouAreDoing.push(`Sleep average: ${sleepAvg.toFixed(1)} / 10`);
    if (fatigueAvg != null) howYouAreDoing.push(`Fatigue average: ${fatigueAvg.toFixed(1)} / 10`);
    if (!howYouAreDoing.length) {
      howYouAreDoing.push(tr(translate, "ai.template.noData", {}, "Not enough scored metrics yet."));
    }
    const thingsToWatch = [];
    if (flareDays > 0 && selected.length > 0 && flareDays / selected.length >= 0.4) {
      thingsToWatch.push("Flare frequency is elevated in this range.");
    }
    if (fatigueAvg != null && fatigueAvg >= 7) thingsToWatch.push("Fatigue trend is high (7+).");
    if (sleepAvg != null && sleepAvg <= 4) thingsToWatch.push("Sleep trend is low (4 or below).");
    if (moodAvg != null && moodAvg <= 4) thingsToWatch.push("Mood trend is low (4 or below).");
    if (!thingsToWatch.length) thingsToWatch.push("No strong warning signals in current range.");
    const important = [];
    const sortedByDate = [...selected].sort((a, b) => a.date.localeCompare(b.date));
    const last = sortedByDate[sortedByDate.length - 1];
    const prev = sortedByDate.length > 1 ? sortedByDate[sortedByDate.length - 2] : null;
    if (last && prev) {
      if (last.fatigue != null && prev.fatigue != null && last.fatigue - prev.fatigue >= 3) {
        important.push("Fatigue rose sharply since your previous log.");
      }
      if (last.sleep != null && prev.sleep != null && prev.sleep - last.sleep >= 3) {
        important.push("Sleep dropped sharply since your previous log.");
      }
      if (last.mood != null && prev.mood != null && prev.mood - last.mood >= 3) {
        important.push("Mood dropped sharply since your previous log.");
      }
    }
    if (!important.length) important.push("No sudden changes detected between recent logs.");
    const correlations = [];
    const moodSleepPairs = selected.filter((x) => x.mood != null && x.sleep != null);
    const sleepFatiguePairs = selected.filter((x) => x.sleep != null && x.fatigue != null);
    const moodFatiguePairs = selected.filter((x) => x.mood != null && x.fatigue != null);
    const cMoodSleep = pearson(moodSleepPairs.map((p) => p.mood), moodSleepPairs.map((p) => p.sleep));
    const cSleepFatigue = pearson(sleepFatiguePairs.map((p) => p.sleep), sleepFatiguePairs.map((p) => p.fatigue));
    const cMoodFatigue = pearson(moodFatiguePairs.map((p) => p.mood), moodFatiguePairs.map((p) => p.fatigue));
    function pushCorrelation(metricA, metricB, coef) {
      const strength = Math.abs(coef) > 0.7 ? "strongly" : Math.abs(coef) > 0.5 ? "usually" : "sometimes";
      const direction = coef > 0 ? "goes up when" : "goes down when";
      correlations.push(`${metricA} ${strength} ${direction} ${metricB} (${coef.toFixed(2)}).`);
    }
    if (cMoodSleep != null && Math.abs(cMoodSleep) >= 0.35) pushCorrelation("Mood", "sleep", cMoodSleep);
    if (cSleepFatigue != null && Math.abs(cSleepFatigue) >= 0.35) pushCorrelation("Sleep", "fatigue", cSleepFatigue);
    if (cMoodFatigue != null && Math.abs(cMoodFatigue) >= 0.35) pushCorrelation("Mood", "fatigue", cMoodFatigue);
    if (!correlations.length) {
      correlations.push(tr(translate, "ai.template.noData", {}, "No strong metric correlations detected in this range yet."));
    }
    const groupsThatChangeTogether = [];
    if (cMoodSleep != null && Math.abs(cMoodSleep) >= 0.35) {
      groupsThatChangeTogether.push(
        cMoodSleep > 0 ? "Mood and sleep tend to move together." : "Mood and sleep tend to move in opposite directions."
      );
    }
    if (cSleepFatigue != null && Math.abs(cSleepFatigue) >= 0.35) {
      groupsThatChangeTogether.push(
        cSleepFatigue > 0 ? "Sleep and fatigue rise/fall together." : "Better sleep tends to pair with lower fatigue."
      );
    }
    if (cMoodFatigue != null && Math.abs(cMoodFatigue) >= 0.35) {
      groupsThatChangeTogether.push(
        cMoodFatigue > 0 ? "Mood and fatigue increase/decrease together." : "Lower fatigue tends to pair with better mood."
      );
    }
    if (!groupsThatChangeTogether.length) {
      groupsThatChangeTogether.push("Not enough linked movement yet to form a clear group.");
    }
    let matchingSignals = 0;
    const flareNotes = [];
    if (fatigueAvg != null && fatigueAvg >= 7) {
      matchingSignals += 1;
      flareNotes.push("Fatigue is elevated.");
    }
    if (sleepAvg != null && sleepAvg <= 4) {
      matchingSignals += 1;
      flareNotes.push("Sleep score is low.");
    }
    if (moodAvg != null && moodAvg <= 4) {
      matchingSignals += 1;
      flareNotes.push("Mood score is low.");
    }
    const topSymOnce = topItems(selected, "symptoms", 1);
    if (topSymOnce.length > 0) {
      const m = topSymOnce[0].match(/\((\d+)\)$/);
      const count = m ? Number(m[1]) : 0;
      if (count >= 3) {
        matchingSignals += 1;
        flareNotes.push("One symptom appears frequently.");
      }
    }
    if (selected.length > 0 && flareDays / selected.length >= 0.4) {
      matchingSignals += 1;
      flareNotes.push("Recent flare frequency is elevated.");
    }
    const level = matchingSignals >= 4 ? "High" : matchingSignals >= 2 ? "Medium" : "Low";
    if (!flareNotes.length) flareNotes.push("No strong flare-up indicators in this range.");
    return {
      totalLogs: selected.length,
      rangeLabel,
      flareDays,
      avgMood: moodAvg,
      avgSleep: sleepAvg,
      avgFatigue: fatigueAvg,
      topSymptoms: topItems(selected, "symptoms"),
      topStressors: topItems(selected, "stressors"),
      whatYouLogged,
      howYouAreDoing,
      thingsToWatch,
      important,
      correlations,
      groupsThatChangeTogether,
      possibleFlareUp: { level, matchingSignals, notes: flareNotes },
      _selectedLogs: selected
    };
  }

  // packages/ai-engine/src/insightRanking.mjs
  function slugId(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  }
  function collectInsightCandidates(analysis) {
    const a = analysis && typeof analysis === "object" ? analysis : {};
    const items = [];
    (a.anomalies || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: "anomaly" }));
    (a.riskFactors || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: "risk" }));
    (a.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: "correlation" }));
    (a.patterns || []).forEach((text) => items.push({ text: String(text), score: 0.4, source: "pattern" }));
    return items;
  }
  function collectInsightCandidatesFromSummary(summary) {
    const s = summary && typeof summary === "object" ? summary : {};
    const items = [];
    (s.important || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: "anomaly" }));
    (s.thingsToWatch || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: "risk" }));
    (s.possibleFlareUp?.notes || []).forEach((text) => {
      if (String(text).includes("No strong")) return;
      items.push({ text: String(text), score: 0.8, source: "risk" });
    });
    (s.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: "correlation" }));
    (s.groupsThatChangeTogether || []).forEach((text) => {
      if (String(text).includes("Not enough")) return;
      items.push({ text: String(text), score: 0.4, source: "pattern" });
    });
    return items;
  }
  function rankInsightItems(items, limit = 7) {
    const seen = /* @__PURE__ */ new Set();
    const deduped = (Array.isArray(items) ? items : []).filter((item) => {
      const text = String(item?.text || "");
      if (!text) return false;
      const key = text.substring(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    deduped.sort((x, y) => (y.score || 0) - (x.score || 0));
    return deduped.slice(0, limit).map((item, idx) => ({
      id: `${item.source}:${slugId(item.text)}`,
      text: item.text,
      score: item.score,
      source: item.source,
      confidence: Math.round((item.score || 0) * 100),
      rank: idx + 1
    }));
  }
  function rankPrioritisedInsights(analysis, limit = 7) {
    return rankInsightItems(collectInsightCandidates(analysis), limit);
  }
  function rankPrioritisedInsightsFromSummary(summary, limit = 7) {
    return rankInsightItems(collectInsightCandidatesFromSummary(summary), limit);
  }
  function buildInsightWhy(insight, logs) {
    const list = Array.isArray(logs) ? logs : [];
    const metrics = ["mood", "sleep", "fatigue", "stiffness", "jointPain"];
    const contributors = [];
    for (const log of list) {
      const hits = metrics.filter((m) => log[m] != null);
      if (!hits.length) continue;
      contributors.push({ date: log.date, metrics: hits.map((m) => ({ id: m, value: log[m] })) });
    }
    return {
      insightId: insight?.id,
      contributingDates: contributors.slice(-5).map((c) => c.date),
      contributingMetrics: contributors.slice(-5),
      confidence: insight?.confidence ?? null
    };
  }

  // packages/ai-engine/src/triggerHypotheses.mjs
  var DEFAULT_MIN_OVERLAP = 5;
  function flareRate(logs) {
    if (!logs.length) return 0;
    return logs.filter((l) => l.flare === "Yes").length / logs.length;
  }
  function filterBadMetric(logs, metric, threshold, direction = "high") {
    return logs.filter((l) => {
      const v = l[metric];
      if (v == null) return false;
      return direction === "high" ? v >= threshold : v <= threshold;
    });
  }
  function computeTriggerHypotheses(logs, options = {}) {
    const minOverlap = options.minOverlap ?? DEFAULT_MIN_OVERLAP;
    const list = Array.isArray(logs) ? logs : [];
    if (list.length < minOverlap) return [];
    const baseline = flareRate(list);
    const hypotheses = [];
    const checks = [
      { factor: "low_sleep", label: "Sleep \u2264 4", subset: filterBadMetric(list, "sleep", 4, "low") },
      { factor: "high_fatigue", label: "Fatigue \u2265 7", subset: filterBadMetric(list, "fatigue", 7, "high") },
      { factor: "low_mood", label: "Mood \u2264 4", subset: filterBadMetric(list, "mood", 4, "low") }
    ];
    for (const check of checks) {
      if (check.subset.length < minOverlap) continue;
      const rate = flareRate(check.subset);
      const lift = rate - baseline;
      if (lift <= 0.05) continue;
      hypotheses.push({
        id: `trigger:${check.factor}`,
        factor: check.factor,
        label: check.label,
        overlap: check.subset.length,
        flareRateWhenPresent: Math.round(rate * 100),
        baselineFlareRate: Math.round(baseline * 100),
        lift: Math.round(lift * 100)
      });
    }
    const stressCounts = /* @__PURE__ */ new Map();
    list.forEach((log) => {
      if (log.flare !== "Yes" || !Array.isArray(log.stressors)) return;
      log.stressors.forEach((s) => {
        if (typeof s !== "string" || !s.trim()) return;
        stressCounts.set(s.trim(), (stressCounts.get(s.trim()) ?? 0) + 1);
      });
    });
    [...stressCounts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([name, count]) => {
      const subset = list.filter((l) => Array.isArray(l.stressors) && l.stressors.includes(name));
      if (subset.length < minOverlap) return;
      const rate = flareRate(subset);
      const lift = rate - baseline;
      if (lift <= 0.05) return;
      hypotheses.push({
        id: `trigger:stressor:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        factor: "stressor",
        label: `Stressor: ${name}`,
        overlap: subset.length,
        flareRateWhenPresent: Math.round(rate * 100),
        baselineFlareRate: Math.round(baseline * 100),
        lift: Math.round(lift * 100)
      });
    });
    return hypotheses.sort((a, b) => b.lift - a.lift).slice(0, 5);
  }

  // packages/ai-engine/src/anomalies.mjs
  function mean2(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function detectMetricAnomalies(logs, options = {}) {
    const list = [...Array.isArray(logs) ? logs : []].sort((a, b) => a.date.localeCompare(b.date));
    const baselineDays = options.baselineDays ?? 30;
    const recentDays = options.recentDays ?? 7;
    const baseline = list.slice(-baselineDays);
    const recent = list.slice(-recentDays);
    const alerts = [];
    for (const metric of ["fatigue", "mood", "sleep"]) {
      const baseVals = baseline.map((l) => l[metric]).filter((v) => v != null);
      const recentVals = recent.map((l) => l[metric]).filter((v) => v != null);
      if (baseVals.length < 3 || recentVals.length < 2) continue;
      const baseAvg = mean2(baseVals);
      const recentAvg = mean2(recentVals);
      if (baseAvg == null || recentAvg == null) continue;
      const delta = recentAvg - baseAvg;
      const threshold = metric === "fatigue" ? 2 : metric === "sleep" ? -2 : -2;
      const isAnomaly = metric === "fatigue" ? delta >= threshold : metric === "sleep" ? delta <= threshold : delta <= threshold;
      if (!isAnomaly) continue;
      alerts.push({
        id: `anomaly:${metric}`,
        metric,
        baselineAvg: Number(baseAvg.toFixed(1)),
        recentAvg: Number(recentAvg.toFixed(1)),
        delta: Number(delta.toFixed(1)),
        severity: Math.abs(delta) >= 3 ? "high" : "medium",
        message: metric === "fatigue" ? `Fatigue is unusually high vs your ${baselineDays}-day baseline.` : metric === "sleep" ? `Sleep is unusually low vs your ${baselineDays}-day baseline.` : `Mood is unusually low vs your ${baselineDays}-day baseline.`
      });
    }
    return alerts;
  }

  // packages/ai-engine/src/weeklyDigest.mjs
  var METRIC_LABELS = {
    mood: "Mood",
    sleep: "Sleep",
    fatigue: "Fatigue"
  };
  var TRACKED_METRICS = ["mood", "sleep", "fatigue"];
  function mean3(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function readScaleMetric(log, field) {
    const raw = log?.[field];
    if (raw == null || raw === "") return null;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (!Number.isFinite(n) || n < 0 || n > 10) return null;
    return n;
  }
  function formatChangeMessage(metric, prior, current, kind) {
    const label = METRIC_LABELS[metric] || metric;
    const p = prior.toFixed(1);
    const c = current.toFixed(1);
    if (kind === "improvement") {
      if (metric === "fatigue") return `${label} eased (${p} \u2192 ${c}/10).`;
      return `${label} averaged ${c}/10 (up from ${p}).`;
    }
    if (metric === "fatigue") return `${label} increased (${p} \u2192 ${c}/10).`;
    return `${label} averaged ${c}/10 (down from ${p}).`;
  }
  function buildHeadline(improvements, concerns) {
    if (improvements.length) return "Your week shows positive shifts in a few areas.";
    if (concerns.length) return "A few metrics shifted this week \u2014 worth a look.";
    return "Keep logging to build your weekly digest.";
  }
  function buildWeeklyDigest(logs, goals = {}) {
    const list = [...Array.isArray(logs) ? logs : []].sort((a, b) => a.date.localeCompare(b.date));
    const thisWeek = list.slice(-7);
    const priorWeek = list.slice(-14, -7);
    const improvements = [];
    const concerns = [];
    const changes = [];
    const goalStatus = [];
    for (const metric of TRACKED_METRICS) {
      const tw = mean3(thisWeek.map((l) => readScaleMetric(l, metric)).filter((v) => v != null));
      const pw = mean3(priorWeek.map((l) => readScaleMetric(l, metric)).filter((v) => v != null));
      if (tw == null || pw == null) continue;
      const delta = tw - pw;
      if (metric === "fatigue") {
        if (delta <= -0.5) {
          const msg = formatChangeMessage(metric, pw, tw, "improvement");
          improvements.push(msg);
          changes.push({
            metric,
            priorAvg: Number(pw.toFixed(1)),
            thisAvg: Number(tw.toFixed(1)),
            delta: Number(delta.toFixed(1)),
            kind: "improvement"
          });
        }
        if (delta >= 0.5) {
          const msg = formatChangeMessage(metric, pw, tw, "concern");
          concerns.push(msg);
          changes.push({
            metric,
            priorAvg: Number(pw.toFixed(1)),
            thisAvg: Number(tw.toFixed(1)),
            delta: Number(delta.toFixed(1)),
            kind: "concern"
          });
        }
      } else {
        if (delta >= 0.5) {
          const msg = formatChangeMessage(metric, pw, tw, "improvement");
          improvements.push(msg);
          changes.push({
            metric,
            priorAvg: Number(pw.toFixed(1)),
            thisAvg: Number(tw.toFixed(1)),
            delta: Number(delta.toFixed(1)),
            kind: "improvement"
          });
        }
        if (delta <= -0.5) {
          const msg = formatChangeMessage(metric, pw, tw, "concern");
          concerns.push(msg);
          changes.push({
            metric,
            priorAvg: Number(pw.toFixed(1)),
            thisAvg: Number(tw.toFixed(1)),
            delta: Number(delta.toFixed(1)),
            kind: "concern"
          });
        }
      }
    }
    if (goals.sleep != null) {
      const twSleep = mean3(thisWeek.map((l) => readScaleMetric(l, "sleep")).filter((v) => v != null));
      goalStatus.push({
        goal: "sleep",
        target: goals.sleep,
        actual: twSleep != null ? Number(twSleep.toFixed(1)) : null,
        met: twSleep != null && twSleep >= goals.sleep
      });
    }
    return {
      improvements: improvements.slice(0, 3),
      concerns: concerns.slice(0, 3),
      changes: changes.slice(0, 6),
      goalStatus,
      headline: buildHeadline(improvements, concerns)
    };
  }

  // packages/ai-engine/src/treatmentTimeline.mjs
  function mean4(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function compareTreatmentWindows(logs, treatmentStarts = []) {
    const list = [...Array.isArray(logs) ? logs : []].sort((a, b) => a.date.localeCompare(b.date));
    const starts = Array.isArray(treatmentStarts) ? treatmentStarts : [];
    return starts.filter((t2) => t2 && t2.date && /^\d{4}-\d{2}-\d{2}$/.test(t2.date)).flatMap((treatment) => {
      const idx = list.findIndex((l) => l.date >= treatment.date);
      if (idx < 0) return [];
      const pre = list.slice(Math.max(0, idx - 14), idx);
      const post = list.slice(idx, idx + 14);
      const preFatigue = mean4(pre.map((l) => l.fatigue).filter((v) => v != null));
      const postFatigue = mean4(post.map((l) => l.fatigue).filter((v) => v != null));
      const preFlare = pre.length ? pre.filter((l) => l.flare === "Yes").length / pre.length : null;
      const postFlare = post.length ? post.filter((l) => l.flare === "Yes").length / post.length : null;
      return [{
        id: `treatment:${treatment.date}`,
        label: treatment.label || treatment.name || "Treatment start",
        startDate: treatment.date,
        preDays: pre.length,
        postDays: post.length,
        preFatigueAvg: preFatigue != null ? Number(preFatigue.toFixed(1)) : null,
        postFatigueAvg: postFatigue != null ? Number(postFatigue.toFixed(1)) : null,
        preFlareRate: preFlare != null ? Math.round(preFlare * 100) : null,
        postFlareRate: postFlare != null ? Math.round(postFlare * 100) : null
      }];
    });
  }

  // packages/ai-engine/src/conditionPacks.mjs
  var CONDITION_ANALYSIS_PACKS = {
    migraine: {
      id: "migraine",
      watchMetrics: ["fatigue", "sleep", "mood"],
      triggers: ["low_sleep", "high_fatigue"],
      advice: ["Track sleep consistency around headache days.", "Note weather sensitivity if logged."]
    },
    ibs: {
      id: "ibs",
      watchMetrics: ["fatigue", "mood", "stressors"],
      triggers: ["stressor"],
      advice: ["Log meals and stressors on flare days.", "Look for stress\u2013symptom overlap in correlations."]
    }
  };
  function applyConditionPack(packId, analysis) {
    const pack = CONDITION_ANALYSIS_PACKS[packId];
    if (!pack) return { pack: null, hints: [] };
    const hints = [...pack.advice];
    if (analysis?.possibleFlareUp?.level === "High") {
      hints.unshift(`(${pack.id}) Elevated flare signals. Review ${pack.watchMetrics.join(", ")}.`);
    }
    return { pack, hints: hints.slice(0, 3) };
  }

  // packages/ai-engine/src/analyze.mjs
  function runDeterministicAnalysis(logs, range = 30, options = {}) {
    const summary = summarizeLogsForAi(logs, range, options);
    const selected = summary._selectedLogs || [];
    delete summary._selectedLogs;
    const anomalies = detectMetricAnomalies(selected, options.anomalyOptions);
    const anomalyTexts = anomalies.map((a) => a.message);
    const analysisShape = {
      anomalies: [...summary.important, ...anomalyTexts],
      riskFactors: summary.thingsToWatch,
      correlations: summary.correlations,
      patterns: summary.groupsThatChangeTogether
    };
    const insights = rankPrioritisedInsightsFromSummary(
      { ...summary, important: analysisShape.anomalies, thingsToWatch: summary.thingsToWatch },
      7
    );
    const prioritisedInsights = insights.map((i) => i.text);
    const triggerHypotheses = computeTriggerHypotheses(selected, options.triggerOptions);
    const weeklyDigest = buildWeeklyDigest(logs, options.goals);
    const treatmentComparisons = compareTreatmentWindows(logs, options.treatmentStarts);
    const conditionHints = options.conditionPack ? applyConditionPack(options.conditionPack, summary) : { pack: null, hints: [] };
    const insightsWithWhy = insights.map((insight) => ({
      ...insight,
      why: buildInsightWhy(insight, selected)
    }));
    return {
      summary,
      insights: insightsWithWhy,
      prioritisedInsights,
      triggerHypotheses,
      anomalies,
      weeklyDigest,
      treatmentComparisons,
      conditionHints,
      analysisShape
    };
  }
  function rankNeuralAnalysisInsights(analysis, limit = 7) {
    const items = [];
    const a = analysis || {};
    (a.anomalies || []).forEach((text) => items.push({ text: String(text), score: 0.9, source: "anomaly" }));
    (a.riskFactors || []).forEach((text) => items.push({ text: String(text), score: 0.85, source: "risk" }));
    (a.correlations || []).slice(0, 5).forEach((text) => items.push({ text: String(text), score: 0.5, source: "correlation" }));
    (a.patterns || []).forEach((text) => items.push({ text: String(text), score: 0.4, source: "pattern" }));
    const ranked = rankInsightItems(items, limit);
    return {
      insights: ranked,
      prioritisedInsights: ranked.map((i) => i.text)
    };
  }

  // packages/shared/src/charts/customMetrics.mjs
  function customMetricFieldKey(id) {
    return `custom_${id}`;
  }
  function isCustomMetricField(field) {
    return typeof field === "string" && field.startsWith("custom_");
  }
  function readCustomMetricRadarValue(log, def) {
    const bag = log?.customMetrics;
    if (!bag || typeof bag !== "object") return null;
    const raw = bag[def.id];
    if (def.type === "boolean") {
      if (typeof raw === "boolean") return raw ? 10 : 0;
      if (raw === "Yes") return 10;
      if (raw === "No") return 0;
      return null;
    }
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.min(10, raw));
    return null;
  }

  // packages/shared/src/home/homeWeather.mjs
  var WEATHER_CACHE_MS = 60 * 60 * 1e3;

  // packages/ai-engine/src/chartAnalytics.mjs
  var METRIC_PAIRS = [
    { metric1: "mood", metric2: "sleep", label1: "Mood", label2: "Sleep" },
    { metric1: "sleep", metric2: "fatigue", label1: "Sleep", label2: "Fatigue" },
    { metric1: "mood", metric2: "fatigue", label1: "Mood", label2: "Fatigue" }
  ];
  var TRACKED_METRICS2 = [
    { key: "mood", label: "Mood" },
    { key: "sleep", label: "Sleep" },
    { key: "fatigue", label: "Fatigue" }
  ];
  function pearson2(xs, ys) {
    if (xs.length !== ys.length || xs.length < 3) return null;
    const n = xs.length;
    const avgX = xs.reduce((a, b) => a + b, 0) / n;
    const avgY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - avgX;
      const dy = ys[i] - avgY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return null;
    return num / Math.sqrt(denX * denY);
  }
  function mean5(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function correlationConfidenceLevel(coef) {
    const abs = Math.abs(coef);
    if (abs >= 0.7) return "high";
    if (abs >= 0.5) return "medium";
    if (abs >= 0.35) return "low";
    return null;
  }
  function buildCorrelationCards(logs, range = 30) {
    const selected = filterLogsByRange(logs, range);
    const cards = [];
    for (const pair of METRIC_PAIRS) {
      const rows = selected.filter(
        (x) => x[pair.metric1] != null && x[pair.metric2] != null
      );
      if (rows.length < 3) continue;
      const coef = pearson2(
        rows.map((r) => Number(r[pair.metric1])),
        rows.map((r) => Number(r[pair.metric2]))
      );
      if (coef == null) continue;
      const confidence = correlationConfidenceLevel(coef);
      if (!confidence) continue;
      const direction = coef > 0 ? "positive" : "negative";
      cards.push({
        id: `${pair.metric1}_${pair.metric2}`,
        metric1: pair.metric1,
        metric2: pair.metric2,
        label1: pair.label1,
        label2: pair.label2,
        coefficient: Number(coef.toFixed(2)),
        confidence,
        direction,
        sampleSize: rows.length
      });
    }
    return cards.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }
  function byDateAsc(a, b) {
    return String(a.date).localeCompare(String(b.date));
  }
  function buildFlarePostMortem(logs, options = {}) {
    const windowDays = options.windowDays ?? 7;
    const minDelta = options.minDelta ?? 0.75;
    const sorted = [...Array.isArray(logs) ? logs : []].sort(byDateAsc);
    if (!sorted.length) return null;
    let flareIndex = -1;
    if (options.flareDate) {
      flareIndex = sorted.findIndex((l) => l.date === options.flareDate && l.flare === "Yes");
    }
    if (flareIndex < 0) {
      for (let i = sorted.length - 1; i >= 0; i -= 1) {
        if (sorted[i].flare === "Yes") {
          flareIndex = i;
          break;
        }
      }
    }
    if (flareIndex < 0) return null;
    const flareDate = sorted[flareIndex].date;
    const before = sorted.slice(Math.max(0, flareIndex - windowDays), flareIndex);
    const after = sorted.slice(flareIndex + 1, flareIndex + 1 + windowDays);
    const metrics = TRACKED_METRICS2.map(({ key, label }) => {
      const beforeVals = before.map((l) => l[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
      const afterVals = after.map((l) => l[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
      const beforeAvg = mean5(beforeVals);
      const afterAvg = mean5(afterVals);
      const delta = beforeAvg != null && afterAvg != null ? Number((afterAvg - beforeAvg).toFixed(2)) : null;
      return {
        key,
        label,
        beforeAvg: beforeAvg != null ? Number(beforeAvg.toFixed(2)) : null,
        afterAvg: afterAvg != null ? Number(afterAvg.toFixed(2)) : null,
        delta,
        diverged: delta != null && Math.abs(delta) >= minDelta
      };
    });
    return {
      flareDate,
      windowDays,
      beforeDays: before.length,
      afterDays: after.length,
      metrics,
      diverging: metrics.filter((m) => m.diverged)
    };
  }
  var CYCLE_PHASE_COLORS = {
    menstrual: "#e91e63",
    follicular: "#81c784",
    ovulation: "#ffd54f",
    luteal: "#9575cd"
  };
  var CYCLE_PHASES = /* @__PURE__ */ new Set(["menstrual", "follicular", "ovulation", "luteal"]);
  function toDateStr(d) {
    return d.toISOString().slice(0, 10);
  }
  function monthWindow(refDateStr, offsetMonths = 0) {
    const ref = /^\d{4}-\d{2}-\d{2}$/.test(refDateStr) ? /* @__PURE__ */ new Date(`${refDateStr}T12:00:00`) : /* @__PURE__ */ new Date();
    const start = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths, 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths + 1, 0);
    const label = start.toLocaleString("en-GB", { month: "short", year: "numeric" });
    return { startDate: toDateStr(start), endDate: toDateStr(end), label };
  }
  function summarizeMetricWindow(logs, startDate, endDate) {
    const rows = logs.filter((l) => l.date >= startDate && l.date <= endDate);
    const mood = mean5(rows.map((l) => l.mood).filter((v) => typeof v === "number"));
    const sleep = mean5(rows.map((l) => l.sleep).filter((v) => typeof v === "number"));
    const fatigue = mean5(rows.map((l) => l.fatigue).filter((v) => typeof v === "number"));
    const flareDays = rows.filter((l) => l.flare === "Yes").length;
    return {
      logDays: rows.length,
      moodAvg: mood != null ? Number(mood.toFixed(2)) : null,
      sleepAvg: sleep != null ? Number(sleep.toFixed(2)) : null,
      fatigueAvg: fatigue != null ? Number(fatigue.toFixed(2)) : null,
      flareDays
    };
  }
  function buildCyclePhaseBands(logs) {
    const sorted = [...Array.isArray(logs) ? logs : []].filter((l) => l?.cycle?.phase && CYCLE_PHASES.has(l.cycle.phase)).sort(byDateAsc);
    if (!sorted.length) return { bands: [], markers: [] };
    const bands = [];
    let runPhase = sorted[0].cycle.phase;
    let runStart = sorted[0].date;
    let runEnd = sorted[0].date;
    for (let i = 1; i < sorted.length; i += 1) {
      const log = sorted[i];
      const phase = log.cycle.phase;
      const prev = sorted[i - 1];
      const gapDays = (new Date(log.date) - new Date(prev.date)) / 864e5;
      if (phase === runPhase && gapDays <= 2) {
        runEnd = log.date;
        continue;
      }
      bands.push({
        phase: runPhase,
        label: runPhase,
        startDate: runStart,
        endDate: runEnd,
        color: CYCLE_PHASE_COLORS[runPhase] || "#78909c"
      });
      runPhase = phase;
      runStart = log.date;
      runEnd = log.date;
    }
    bands.push({
      phase: runPhase,
      label: runPhase,
      startDate: runStart,
      endDate: runEnd,
      color: CYCLE_PHASE_COLORS[runPhase] || "#78909c"
    });
    const markers = sorted.map((l) => ({
      date: l.date,
      phase: l.cycle.phase,
      cycleDay: l.cycle.cycleDay ?? null
    }));
    return { bands, markers };
  }
  function cycleBandsToApexAnnotations(bands) {
    if (!Array.isArray(bands) || !bands.length) return [];
    return bands.map((b) => ({
      x: (/* @__PURE__ */ new Date(`${b.startDate}T00:00:00`)).getTime(),
      x2: (/* @__PURE__ */ new Date(`${b.endDate}T23:59:59`)).getTime(),
      fillColor: b.color,
      opacity: 0.14,
      borderWidth: 0,
      label: {
        text: b.label,
        style: { fontSize: "10px", background: "transparent", color: b.color }
      }
    }));
  }
  function compareChartPeriods(logs, options = {}) {
    const sorted = [...Array.isArray(logs) ? logs : []].sort(byDateAsc);
    if (!sorted.length) return null;
    const refDate = options.refDate || sorted[sorted.length - 1].date;
    const current = monthWindow(refDate, 0);
    const previous = monthWindow(refDate, -1);
    const currentStats = summarizeMetricWindow(sorted, current.startDate, current.endDate);
    const previousStats = summarizeMetricWindow(sorted, previous.startDate, previous.endDate);
    const delta = (cur, prev) => cur != null && prev != null ? Number((cur - prev).toFixed(2)) : null;
    const treatmentMarkers = compareTreatmentWindows(sorted, options.treatmentStarts || []);
    return {
      mode: "month",
      current: { ...current, stats: currentStats },
      previous: { ...previous, stats: previousStats },
      deltas: {
        mood: delta(currentStats.moodAvg, previousStats.moodAvg),
        sleep: delta(currentStats.sleepAvg, previousStats.sleepAvg),
        fatigue: delta(currentStats.fatigueAvg, previousStats.fatigueAvg),
        flareDays: currentStats.flareDays - previousStats.flareDays
      },
      treatmentMarkers
    };
  }
  function exerciseSpoonLoad(log) {
    if (!Array.isArray(log?.exercise)) return 0;
    return log.exercise.reduce((sum, ex) => {
      const dur = typeof ex?.duration === "number" && Number.isFinite(ex.duration) ? ex.duration : 15;
      return sum + Math.min(3, dur / 15);
    }, 0);
  }
  function plannedSpoonsForIndex(sorted, index) {
    const prior = sorted.slice(Math.max(0, index - 7), index);
    const fatigueVals = prior.map((l) => l.fatigue).filter((v) => typeof v === "number");
    const avgFatigue = mean5(fatigueVals) ?? 5;
    return Math.max(1, Math.min(10, Math.round(10 - avgFatigue)));
  }
  var BALANCE_RADAR_BUILTIN = [
    { field: "fatigue", label: "Fatigue", max: 10 },
    { field: "stiffness", label: "Stiffness", max: 10 },
    { field: "backPain", label: "Back Pain", max: 10 },
    { field: "sleep", label: "Sleep Quality", max: 10 },
    { field: "jointPain", label: "Joint Pain", max: 10 },
    { field: "mobility", label: "Mobility", max: 10 },
    { field: "dailyFunction", label: "Daily Function", max: 10 },
    { field: "swelling", label: "Swelling", max: 10 },
    { field: "mood", label: "Mood", max: 10 },
    { field: "irritability", label: "Irritability", max: 10 },
    { field: "weatherSensitivity", label: "Weather Sensitivity", max: 10 },
    { field: "hydration", label: "Hydration", max: 20, radarMax: 10 }
  ];
  function readBuiltinRadarValue(log, metric) {
    const raw = log[metric.field];
    if (raw === void 0 || raw === null || raw === "") return null;
    const val = typeof raw === "number" ? raw : parseFloat(raw);
    if (!Number.isFinite(val) || val < 0) return null;
    if (metric.field === "hydration") {
      return Math.min(metric.radarMax ?? 10, Math.max(0, val / metric.max * (metric.radarMax ?? 10)));
    }
    return Math.min(10, Math.max(0, val));
  }
  function metricCatalog(customMetrics = []) {
    const custom = (Array.isArray(customMetrics) ? customMetrics : []).map((def) => ({
      field: customMetricFieldKey(def.id),
      label: def.label,
      max: def.type === "boolean" ? 1 : 10,
      radarMax: 10,
      customDef: def
    }));
    return [...BALANCE_RADAR_BUILTIN, ...custom];
  }
  function buildBalanceRadarData(logs, options = {}) {
    const range = options.range ?? "all";
    const selected = range === "all" ? [...Array.isArray(logs) ? logs : []].sort(byDateAsc) : filterLogsByRange(logs, range).sort(byDateAsc);
    const catalog = metricCatalog(options.customMetrics);
    const selectedFields = Array.isArray(options.selectedFields) && options.selectedFields.length ? options.selectedFields : ["mood", "sleep", "fatigue"];
    const metrics = catalog.filter((m) => selectedFields.includes(m.field));
    if (metrics.length < 3) return { labels: [], values: [], metrics: [] };
    const rows = [];
    for (const metric of metrics) {
      const values = selected.map((log) => {
        if (metric.customDef) return readCustomMetricRadarValue(log, metric.customDef);
        return readBuiltinRadarValue(log, metric);
      }).filter((v) => v != null);
      if (!values.length) continue;
      const avg2 = values.reduce((a, b) => a + b, 0) / values.length;
      rows.push({
        field: metric.field,
        label: metric.label,
        value: Number(avg2.toFixed(2)),
        isCustom: isCustomMetricField(metric.field)
      });
    }
    if (rows.length < 3) return { labels: [], values: [], metrics: [] };
    return {
      labels: rows.map((r) => r.label),
      values: rows.map((r) => r.value),
      metrics: rows
    };
  }
  function buildPacingChartSeries(logs, range = 30) {
    const selected = range === "all" ? [...Array.isArray(logs) ? logs : []].sort(byDateAsc) : filterLogsByRange(logs, range).sort(byDateAsc);
    return selected.map((log, index) => {
      const planned = plannedSpoonsForIndex(selected, index);
      const rawActual = exerciseSpoonLoad(log);
      const actual = Number(Math.min(planned, rawActual).toFixed(1));
      const fatigue = typeof log.fatigue === "number" ? log.fatigue : null;
      const overpaced = rawActual > planned;
      return {
        date: log.date,
        planned,
        actual,
        rawActual: Number(rawActual.toFixed(1)),
        fatigue,
        overpaced
      };
    });
  }
  function buildTodayPacingBudget(logs, todayStr) {
    const sorted = [...Array.isArray(logs) ? logs : []].sort(byDateAsc);
    const idx = sorted.findIndex((l) => l.date === todayStr);
    const prior = idx >= 0 ? sorted.slice(0, idx) : sorted.filter((l) => l.date < todayStr);
    if (prior.length < 2) return null;
    const working = idx >= 0 ? sorted : [...prior, { date: todayStr }];
    const indexForPlan = idx >= 0 ? idx : prior.length;
    let planned = plannedSpoonsForIndex(working, indexForPlan);
    const recentFlares = working.slice(Math.max(0, indexForPlan - 7), indexForPlan).filter((l) => l.flare === "Yes").length;
    if (recentFlares >= 2) planned = Math.max(1, planned - 1);
    if (recentFlares >= 4) planned = Math.max(1, planned - 2);
    const todayLog = idx >= 0 ? sorted[idx] : null;
    const rawActual = todayLog ? exerciseSpoonLoad(todayLog) : 0;
    const actual = todayLog ? Number(Math.min(planned, rawActual).toFixed(1)) : 0;
    const fatigue = todayLog && typeof todayLog.fatigue === "number" ? todayLog.fatigue : null;
    const overpaced = rawActual > planned;
    return {
      date: todayStr,
      planned,
      actual,
      rawActual: Number(rawActual.toFixed(1)),
      fatigue,
      overpaced,
      recentFlares,
      hasTodayLog: idx >= 0
    };
  }

  // packages/ai-engine/src/researchExport.mjs
  function exportAnalysisJsonForResearch(analysis, options = {}) {
    const optIn = options.optIn === true;
    if (!optIn) throw new Error("Research export requires explicit opt-in.");
    const payload = {
      format: "rianell-analysis-v1",
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      rangeLabel: analysis?.summary?.rangeLabel ?? null,
      totalLogs: analysis?.summary?.totalLogs ?? 0,
      prioritisedInsightIds: (analysis?.insights || []).map((i) => i.id),
      triggerHypothesisIds: (analysis?.triggerHypotheses || []).map((h) => h.id),
      anomalyIds: (analysis?.anomalies || []).map((a) => a.id),
      aggregates: {
        avgMood: analysis?.summary?.avgMood ?? null,
        avgSleep: analysis?.summary?.avgSleep ?? null,
        avgFatigue: analysis?.summary?.avgFatigue ?? null,
        flareDays: analysis?.summary?.flareDays ?? 0
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  // packages/ai-engine/src/index.mjs
  function avg(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function tr2(translate, key, params, fallback) {
    if (typeof translate === "function") {
      const result = translate(key, params);
      if (typeof result === "string" && result !== key) return result;
    }
    return fallback;
  }
  function analyzeHealthMetrics(logs, range = 30, options = {}) {
    return summarizeLogsForAi(logs, range, options);
  }
  function predictFutureValues(series, days = 7) {
    if (!series.length || days < 1) return [];
    const xs = series.map((_, i) => i + 1);
    const ys = series.map((v) => Number(v));
    const xAvg = avg(xs) ?? 0;
    const yAvg = avg(ys) ?? 0;
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - xAvg) * (ys[i] - yAvg);
      den += (xs[i] - xAvg) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yAvg - slope * xAvg;
    const resid = ys.map((y, i) => y - (slope * xs[i] + intercept));
    const sigma = Math.sqrt((avg(resid.map((r) => r * r)) ?? 0) || 0.5);
    const out = [];
    const lastX = xs[xs.length - 1] ?? 1;
    for (let d = 1; d <= days; d++) {
      const x = lastX + d;
      const raw = slope * x + intercept;
      const value = Math.max(0, Math.min(10, raw));
      const spread = Math.max(0.4, sigma * 1.2);
      out.push({ dayOffset: d, value, lower: Math.max(0, value - spread), upper: Math.min(10, value + spread) });
    }
    return out;
  }
  function suggestLogNote(context, options = {}) {
    const translate = options?.translate;
    const parts = [];
    if (context && context.flare === "Yes") parts.push("Flare day. Rest and hydration may help.");
    if (context && typeof context.fatigue === "number" && context.fatigue >= 7) {
      parts.push(tr2(translate, "ai.template.worsening", { metric: "Fatigue" }, "Fatigue is high today."));
    }
    if (context && typeof context.sleep === "number" && context.sleep <= 4) parts.push("Sleep was low. Gentle pace recommended.");
    if (context && typeof context.mood === "number" && context.mood <= 4) {
      parts.push(tr2(translate, "ai.template.worsening", { metric: "Mood" }, "Mood is low. Be kind to yourself today."));
    }
    if (!parts.length) parts.push("Steady day. Note anything that helped or hindered how you felt.");
    return parts.join(" ");
  }
  function generateAnalysisNote(summary, options = {}) {
    const translate = options?.translate;
    const parts = [];
    if (summary?.rangeLabel) parts.push(`Range: ${summary.rangeLabel}.`);
    if (summary?.howYouAreDoing?.length) parts.push(summary.howYouAreDoing.join(" "));
    if (summary?.possibleFlareUp?.level) parts.push(`Flare risk: ${summary.possibleFlareUp.level}.`);
    return parts.join(" ") || tr2(translate, "ai.template.noData", {}, "Keep logging to build a clearer picture.");
  }
  var AIEngine = {
    analyzeHealthMetrics,
    predictFutureValues,
    suggestLogNote,
    generateAnalysisNote,
    runDeterministicAnalysis,
    rankNeuralAnalysisInsights
  };
  return __toCommonJS(index_exports);
})();
