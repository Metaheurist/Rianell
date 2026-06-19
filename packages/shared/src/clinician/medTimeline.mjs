/** Plan 12 CL4 — medication / treatment timeline (A4-aligned, Gantt rows). */

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function normalizeTreatmentStarts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t) => t && typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
    .map((t) => ({
      date: t.date,
      label: String(t.label || t.name || t.drug || 'Treatment start').slice(0, 80),
    }));
}

export function inferTreatmentStartsFromLogs(logs) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(a?.date || '').localeCompare(String(b?.date || ''))
  );
  const seen = new Set();
  const starts = [];
  for (const log of list) {
    const names = [];
    if (Array.isArray(log.medications)) {
      log.medications.forEach((m) => {
        const n = typeof m === 'string' ? m : m?.name || m?.drug;
        if (n) names.push(String(n).trim());
      });
    }
    if (Array.isArray(log.medicationDoses)) {
      log.medicationDoses.forEach((d) => {
        if (d?.drug) names.push(String(d.drug).trim());
      });
    }
    for (const name of names) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      starts.push({ date: log.date, label: name });
    }
  }
  return starts.slice(0, 12);
}

export function buildMedicationTimeline(logs, treatmentStarts = [], opts = {}) {
  const list = [...(Array.isArray(logs) ? logs : [])].sort((a, b) =>
    String(a?.date || '').localeCompare(String(b?.date || ''))
  );
  const explicit = normalizeTreatmentStarts(treatmentStarts);
  const starts = explicit.length ? explicit : inferTreatmentStartsFromLogs(logs);
  const windowDays = opts.windowDays ?? 14;
  const rows = starts.flatMap((treatment) => {
    const idx = list.findIndex((l) => l.date >= treatment.date);
    if (idx < 0) return [];
    const pre = list.slice(Math.max(0, idx - windowDays), idx);
    const post = list.slice(idx, idx + windowDays);
    const preFatigue = mean(pre.map((l) => l.fatigue).filter((v) => v != null));
    const postFatigue = mean(post.map((l) => l.fatigue).filter((v) => v != null));
    return [
      {
        id: `treatment:${treatment.date}`,
        label: treatment.label,
        startDate: treatment.date,
        preDays: pre.length,
        postDays: post.length,
        preFatigueAvg: preFatigue != null ? Number(preFatigue.toFixed(1)) : null,
        postFatigueAvg: postFatigue != null ? Number(postFatigue.toFixed(1)) : null,
      },
    ];
  });
  const dates = list.map((l) => l.date).filter(Boolean);
  const spanStart = dates[0] || null;
  const spanEnd = dates[dates.length - 1] || null;
  return { rows, spanStart, spanEnd };
}

export function buildTimelineSvg(rows, opts = {}) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '';
  const width = opts.width ?? 520;
  const rowH = 28;
  const height = 40 + list.length * rowH;
  const left = 120;
  const bars = list
    .map((row, i) => {
      const y = 36 + i * rowH;
      const barW = Math.max(40, width - left - 24);
      const label = String(row.label || '').slice(0, 18);
      const detail = `${row.preFatigueAvg ?? '-'} → ${row.postFatigueAvg ?? '-'}`;
      return `<text x="8" y="${y + 12}" font-size="10" fill="#333">${label}</text>` +
        `<rect x="${left}" y="${y}" width="${barW}" height="16" fill="rgba(76,175,80,0.25)" stroke="#4caf50"/>` +
        `<text x="${left + 6}" y="${y + 12}" font-size="9" fill="#222">${row.startDate} · fatigue ${detail}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`;
}
