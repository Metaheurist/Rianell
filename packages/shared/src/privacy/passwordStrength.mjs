/** Password strength estimator for medical-data contexts (no external deps). */

export const SCORE_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

const COMMON = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'monkey'];
const WALKS = ['qwerty', 'asdfgh', 'zxcvbn', '12345678'];

export function checkPasswordStrength(pw) {
  if (!pw) {
    return { score: 0, label: SCORE_LABELS[0], feedback: ['Enter a password'] };
  }
  let score = 0;
  const feedback = [];
  if (pw.length >= 12) score++;
  else feedback.push('Use at least 12 characters');
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  else feedback.push('Mix upper and lower case');
  if (/\d/.test(pw)) score++;
  else feedback.push('Add a number');
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  else feedback.push('Add a special character');
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low.includes(c)) || WALKS.some((w) => low.includes(w))) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid common patterns');
  }
  const capped = Math.min(4, Math.max(0, score));
  return {
    score: capped,
    label: SCORE_LABELS[capped],
    feedback,
  };
}

export function isWeakPin(pin) {
  if (!pin || pin.length < 4) return true;
  if (!/^\d+$/.test(pin)) return true;
  if (/^(\d)\1+$/.test(pin)) return true;
  const digits = pin.split('').map(Number);
  const asc = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
  const desc = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
  return asc || desc;
}
