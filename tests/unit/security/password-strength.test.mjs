import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPasswordStrength,
  isWeakPin,
  SCORE_LABELS,
} from '../../../packages/shared/src/privacy/passwordStrength.mjs';

test('SCORE_LABELS has five entries', () => {
  assert.equal(SCORE_LABELS.length, 5);
  assert.equal(SCORE_LABELS[0], 'Very weak');
  assert.equal(SCORE_LABELS[4], 'Very strong');
});

test('checkPasswordStrength returns score 0 for empty input', () => {
  const r = checkPasswordStrength('');
  assert.equal(r.score, 0);
  assert.equal(r.label, 'Very weak');
  assert.ok(r.feedback.length > 0);
});

test('checkPasswordStrength returns score 0 for null', () => {
  const r = checkPasswordStrength(null);
  assert.equal(r.score, 0);
});

test('checkPasswordStrength scores short password low', () => {
  const r = checkPasswordStrength('Abc1!');
  assert.ok(r.score < 4);
  assert.ok(r.feedback.some((f) => f.includes('12 characters')));
});

test('checkPasswordStrength scores strong password highly', () => {
  const r = checkPasswordStrength('Tr0ub4dor&3!xY');
  assert.ok(r.score >= 3, `Expected score >=3, got ${r.score}`);
});

test('checkPasswordStrength penalises common patterns', () => {
  const weak = checkPasswordStrength('Password123456!!');
  const strong = checkPasswordStrength('Tr0ub4dor&3!xY99');
  assert.ok(weak.score <= strong.score);
  assert.ok(weak.feedback.some((f) => f.includes('common')));
});

test('checkPasswordStrength requires mixed case', () => {
  const r = checkPasswordStrength('alllowercase12345!');
  assert.ok(r.feedback.some((f) => /upper/i.test(f) || /lower/i.test(f) || /mix/i.test(f)));
});

test('checkPasswordStrength requires special character', () => {
  const r = checkPasswordStrength('Alllowercase12345');
  assert.ok(r.feedback.some((f) => /special/i.test(f)));
});

test('checkPasswordStrength score is capped between 0 and 4', () => {
  for (const pw of ['', 'a', 'Abcdef1234!@#$%XY']) {
    const r = checkPasswordStrength(pw);
    assert.ok(r.score >= 0 && r.score <= 4, `score out of range for "${pw}": ${r.score}`);
  }
});

test('isWeakPin rejects empty and short pins', () => {
  assert.equal(isWeakPin(''), true);
  assert.equal(isWeakPin('123'), true);
  assert.equal(isWeakPin(null), true);
});

test('isWeakPin rejects non-digit pins', () => {
  assert.equal(isWeakPin('abcd'), true);
  assert.equal(isWeakPin('12a4'), true);
});

test('isWeakPin rejects repeating digits', () => {
  assert.equal(isWeakPin('1111'), true);
  assert.equal(isWeakPin('0000'), true);
});

test('isWeakPin rejects sequential ascending pins', () => {
  assert.equal(isWeakPin('1234'), true);
  assert.equal(isWeakPin('2345678'), true);
});

test('isWeakPin rejects sequential descending pins', () => {
  assert.equal(isWeakPin('4321'), true);
  assert.equal(isWeakPin('9876'), true);
});

test('isWeakPin accepts strong pins', () => {
  assert.equal(isWeakPin('3817'), false);
  assert.equal(isWeakPin('92047'), false);
});
