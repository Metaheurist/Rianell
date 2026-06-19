function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function compareTreatmentWindows(logs, treatmentStarts = []) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) => a.date.localeCompare(b.date));
  const starts = Array.isArray(treatmentStarts) ? treatmentStarts : [];
  return starts
    .filter((t) => t && t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
    .map((treatment) => {
      const idx = list.findIndex((l) => l.date >= treatment.date);
      if (idx < 0) return null;
      const pre = list.slice(Math.max(0, idx - 14), idx);
      const post = list.slice(idx, idx + 14);
      const preFatigue = mean(pre.map((l) => l.fatigue).filter((v) => v != null));
      const postFatigue = mean(post.map((l) => l.fatigue).filter((v) => v != null));
      const preFlare = pre.length ? pre.filter((l) => l.flare === 'Yes').length / pre.length : null;
      const postFlare = post.length ? post.filter((l) => l.flare === 'Yes').length / post.length : null;
      return {
        id: `treatment:${treatment.date}`,
        label: treatment.label || treatment.name || 'Treatment start',
        startDate: treatment.date,
        preDays: pre.length,
        postDays: post.length,
        preFatigueAvg: preFatigue != null ? Number(preFatigue.toFixed(1)) : null,
        postFatigueAvg: postFatigue != null ? Number(postFatigue.toFixed(1)) : null,
        preFlareRate: preFlare != null ? Math.round(preFlare * 100) : null,
        postFlareRate: postFlare != null ? Math.round(postFlare * 100) : null,
      };
    })
    .filter(Boolean);
}
