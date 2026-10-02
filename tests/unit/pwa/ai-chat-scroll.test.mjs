import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../apps/pwa-webapp/modules/ai-chat.js', import.meta.url), 'utf8');

test('the follow-up chips and limit notice re-scroll so the newest answer stays visible', () => {
  // Both render into the area under the message list; showing it shrinks the list after renderMessages scrolled.
  for (const fn of ['renderFollowups', 'renderLimitRecovery']) {
    const body = src.match(new RegExp(`function ${fn}\\([^)]*\\) \\{[\\s\\S]*?\\n {2}\\}`));
    assert.ok(body, `${fn} must exist`);
    assert.match(body[0], /scrollMessagesToEnd\(\);\s*\}$/, `${fn} ends by scrolling the messages to the end`);
  }
});
