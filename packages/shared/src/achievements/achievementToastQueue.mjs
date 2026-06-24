/** Sequential in-app achievement toast queue (platform-agnostic). */

/** @typedef {{ id: string, title: string, body: string }} AchievementToastItem */

/** @type {AchievementToastItem[]} */
let queue = [];
let showing = false;

/** @type {((item: AchievementToastItem) => void)|null} */
let presenter = null;

/**
 * @param {(item: AchievementToastItem) => void|null} fn
 */
export function registerAchievementToastPresenter(fn) {
  presenter = fn;
  if (fn) drainQueue();
}

function drainQueue() {
  if (!presenter || showing || !queue.length) return;
  showing = true;
  const item = queue.shift();
  if (item) presenter(item);
}

/**
 * @param {AchievementToastItem} item
 */
export function enqueueAchievementToast(item) {
  if (!item?.id) return;
  queue.push({
    id: String(item.id),
    title: String(item.title || ''),
    body: String(item.body || ''),
  });
  drainQueue();
}

export function markAchievementToastDismissed() {
  showing = false;
  drainQueue();
}

export function getAchievementToastQueueLength() {
  return queue.length;
}

export function isAchievementToastShowing() {
  return showing;
}

export function resetAchievementToastQueue() {
  queue = [];
  showing = false;
  presenter = null;
}
