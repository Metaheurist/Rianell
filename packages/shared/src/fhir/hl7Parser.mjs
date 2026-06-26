/** Plan 20 SH4 — minimal HL7 v2 ORU-R01 parser. */

/**
 * @param {string} message — pipe-delimited HL7 message
 * @returns {Array<{testName:string,value:string,units:string,referenceRange:string,observedAt:string}>}
 */
export function parseORU(message) {
  const text = String(message || '').trim();
  if (!text) return [];
  const segments = text.split(/\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);
  const results = [];
  let observedAt = '';
  for (const seg of segments) {
    const fields = seg.split('|');
    const type = fields[0];
    if (type === 'OBR' && fields[7]) observedAt = fields[7];
    if (type === 'OBX') {
      const testName = (fields[3] || '').split('^')[1] || fields[3] || '';
      results.push({
        testName: testName.trim(),
        value: (fields[5] || '').trim(),
        units: (fields[6] || '').trim(),
        referenceRange: (fields[7] || '').trim(),
        observedAt: (fields[14] || observedAt || '').trim(),
      });
    }
  }
  return results;
}

/** Map parsed lab results to Rianell log partials (best-effort name match). */
export function mapLabResultsToLogFields(labResults) {
  const out = {};
  for (const r of labResults) {
    const name = r.testName.toLowerCase();
    const val = parseFloat(r.value);
    if (!Number.isFinite(val)) continue;
    if (name.includes('glucose')) out.bloodGlucose = val;
    else if (name.includes('weight')) out.weight = val;
    else if (name.includes('systolic')) out.bloodPressureSystolic = val;
    else if (name.includes('diastolic')) out.bloodPressureDiastolic = val;
  }
  return out;
}
