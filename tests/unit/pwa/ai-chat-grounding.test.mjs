import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../apps/pwa-webapp/modules/ai-chat.js', import.meta.url), 'utf8');
const runInference = src.match(/async function runInference\(userMessage\) \{[\s\S]*?\n {2}\}/)[0];
const submit = src.match(/async function submitUserMessage\(\) \{[\s\S]*?\n {2}\}/)[0];

test('runInference grounds model replies for English only, with logged days and advice intent', () => {
  assert.match(runInference, /locale\.indexOf\('en'\) === 0/);
  assert.match(runInference, /S\.groundHealthChatReply\(reply, \{/);
  assert.match(runInference, /loggedDays: \(_analysis && _analysis\.totalLogs\) \|\| 0/);
  assert.match(runInference, /adviceRequested: FASTPATH_ADVICE_RE\.test\(/);
  assert.match(runInference, /\}\) \|\| fallback;/, 'an empty grounded reply falls back to the deterministic answer');
});

test('grounding runs after the NSFW gate and never on the fallback text', () => {
  assert.ok(runInference.indexOf('isNsfwText(reply)') < runInference.indexOf('groundHealthChatReply'));
  assert.match(runInference, /reply !== fallback/);
});

test('the grounded reply is what gets stored in the chat history', () => {
  // submitUserMessage stores the runInference result, so invented lines never reach later turns.
  assert.match(submit, /var answer = await runInference\(message\);/);
  assert.match(submit, /\.assistant = answer \|\| buildFallback\(message\);/);
});
