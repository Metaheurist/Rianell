/** SHA-256 hash of medical condition label for anonymized_data.medical_condition (k-anon pool). */

export const MEDICAL_CONDITION_POOL_SALT = 'rianell-anon-pool-v1';

/**
 * @param {string} label Plaintext condition label (e.g. from settings)
 * @returns {Promise<string>} Lowercase hex SHA-256 of salt:normalized label
 */
export async function hashMedicalConditionLabel(label) {
  const text = String(label || '').trim().toLowerCase();
  if (!text) return '';
  const payload = `${MEDICAL_CONDITION_POOL_SALT}:${text}`;
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @param {string} label
 * @returns {Promise<string>} Hashed label or empty if input invalid
 */
export async function medicalConditionForPoolStorage(label) {
  return hashMedicalConditionLabel(label);
}
