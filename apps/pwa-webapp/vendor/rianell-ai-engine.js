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
    analyzeHealthMetrics: () => analyzeHealthMetrics,
    filterLogsByRange: () => filterLogsByRange,
    predictFutureValues: () => predictFutureValues,
    suggestLogNote: () => suggestLogNote
  });
  function avg(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function mean(values) {
    return avg(values);
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
      const d = /* @__PURE__ */ new Date(`${log.date}T00:00:00`);
      return d >= start && d <= today;
    });
  }
  function analyzeHealthMetrics(logs, range = 30) {
    const selected = filterLogsByRange(logs, range);
    const rangeLabel = range === "all" ? "All time" : `Last ${range} days`;
    const flareDays = selected.filter((x) => x.flare === "Yes").length;
    const mood = selected.map((x) => x.mood).filter((x) => x != null);
    const sleep = selected.map((x) => x.sleep).filter((x) => x != null);
    const fatigue = selected.map((x) => x.fatigue).filter((x) => x != null);
    const moodAvg = mean(mood);
    const sleepAvg = mean(sleep);
    const fatigueAvg = mean(fatigue);
    const howYouAreDoing = [];
    if (moodAvg != null) howYouAreDoing.push(`Mood average: ${moodAvg.toFixed(1)} / 10`);
    if (sleepAvg != null) howYouAreDoing.push(`Sleep average: ${sleepAvg.toFixed(1)} / 10`);
    if (fatigueAvg != null) howYouAreDoing.push(`Fatigue average: ${fatigueAvg.toFixed(1)} / 10`);
    if (!howYouAreDoing.length) howYouAreDoing.push("Not enough scored metrics yet.");
    const correlations = [];
    const moodSleepPairs = selected.filter((x) => x.mood != null && x.sleep != null);
    const cMoodSleep = pearson(moodSleepPairs.map((p) => p.mood), moodSleepPairs.map((p) => p.sleep));
    if (cMoodSleep != null && Math.abs(cMoodSleep) >= 0.35) {
      correlations.push(`Mood and sleep correlation: ${cMoodSleep.toFixed(2)}.`);
    }
    if (!correlations.length) correlations.push("No strong metric correlations detected in this range yet.");
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
    const level = matchingSignals >= 4 ? "High" : matchingSignals >= 2 ? "Medium" : "Low";
    return {
      totalLogs: selected.length,
      rangeLabel,
      flareDays,
      avgMood: moodAvg,
      avgSleep: sleepAvg,
      avgFatigue: fatigueAvg,
      topSymptoms: topItems(selected, "symptoms"),
      topStressors: topItems(selected, "stressors"),
      howYouAreDoing,
      correlations,
      possibleFlareUp: { level, matchingSignals, notes: flareNotes.length ? flareNotes : ["No strong flare-up indicators."] }
    };
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
  function suggestLogNote(context) {
    const parts = [];
    if (context && context.flare === "Yes") parts.push("Flare day \u2014 rest and hydration may help.");
    if (context && typeof context.fatigue === "number" && context.fatigue >= 7) parts.push("Fatigue is high today.");
    if (context && typeof context.sleep === "number" && context.sleep <= 4) parts.push("Sleep was low \u2014 gentle pace recommended.");
    if (context && typeof context.mood === "number" && context.mood <= 4) parts.push("Mood is low \u2014 be kind to yourself today.");
    if (!parts.length) parts.push("Steady day \u2014 note anything that helped or hindered how you felt.");
    return parts.join(" ");
  }
  var AIEngine = {
    analyzeHealthMetrics,
    predictFutureValues,
    suggestLogNote
  };
  return __toCommonJS(index_exports);
})();
