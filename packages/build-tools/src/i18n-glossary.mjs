/** Terms that must not be machine-translated (brand, medical, product names). */
export const GLOSSARY_TERMS = [
  'Rianell',
  'Supabase',
  'BPM',
  'GDPR',
  'flare-up',
  'flare up',
  'WhatsApp',
  'JSON',
  'PDF',
  'CSV',
  'Excel',
  'GPU',
];

export function protectGlossary(text) {
  let out = text;
  const placeholders = [];
  GLOSSARY_TERMS.forEach((term, i) => {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, () => {
      const ph = `__GLOSS${i}__`;
      placeholders.push({ ph, term });
      return ph;
    });
  });
  return { text: out, placeholders };
}

export function restoreGlossary(text, placeholders) {
  let out = text;
  for (const { ph, term } of placeholders) {
    out = out.split(ph).join(term);
  }
  return out;
}
