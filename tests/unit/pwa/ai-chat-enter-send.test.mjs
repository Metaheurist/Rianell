import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../apps/pwa-webapp/modules/ai-chat.js', import.meta.url), 'utf8');

const fnSrc = src.match(/function isSendKey\(e\) \{[\s\S]*?\n {2}\}/);
assert.ok(fnSrc, 'isSendKey must exist in ai-chat.js');
const isSendKey = new Function(`${fnSrc[0]}; return isSendKey;`)();

const key = (overrides) => ({
  key: 'Enter', shiftKey: false, altKey: false, ctrlKey: false, metaKey: false,
  isComposing: false, keyCode: 13, ...overrides,
});

test('plain Enter sends', () => {
  assert.equal(isSendKey(key({})), true);
});

test('Ctrl/Cmd+Enter also send', () => {
  assert.equal(isSendKey(key({ ctrlKey: true })), true);
  assert.equal(isSendKey(key({ metaKey: true })), true);
});

test('Shift+Enter and Alt+Enter keep the newline', () => {
  assert.equal(isSendKey(key({ shiftKey: true })), false);
  assert.equal(isSendKey(key({ altKey: true })), false);
});

test('Enter while an IME is composing confirms the candidate instead of sending', () => {
  assert.equal(isSendKey(key({ isComposing: true })), false);
  assert.equal(isSendKey(key({ keyCode: 229 })), false);
});

test('other keys never send', () => {
  assert.equal(isSendKey(key({ key: 'a', keyCode: 65 })), false);
  assert.equal(isSendKey(null), false);
});

test('the follow-up chips and limit notice re-scroll so the newest answer stays visible', () => {
  // Both render into the area under the message list; showing it shrinks the list after renderMessages scrolled.
  for (const fn of ['renderFollowups', 'renderLimitRecovery']) {
    const body = src.match(new RegExp(`function ${fn}\\([^)]*\\) \\{[\\s\\S]*?\\n {2}\\}`));
    assert.ok(body, `${fn} must exist`);
    assert.match(body[0], /scrollMessagesToEnd\(\);\s*\}$/, `${fn} ends by scrolling the messages to the end`);
  }
});

test('the chat textarea routes the send key through submitUserMessage', () => {
  assert.match(
    src,
    /chatInput\.addEventListener\('keydown', function \(e\) \{\s*if \(!isSendKey\(e\)\) return;\s*e\.preventDefault\(\);\s*submitUserMessage\(\);/,
  );
});
