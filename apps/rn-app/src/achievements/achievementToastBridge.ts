export type AchievementToastPayload = {
  id: string;
  title: string;
  body: string;
};

type ShowListener = (payload: AchievementToastPayload) => void;

let showListener: ShowListener | null = null;
const pending: AchievementToastPayload[] = [];

export function registerAchievementToastShowListener(fn: ShowListener | null) {
  showListener = fn;
  if (fn) {
    while (pending.length) {
      fn(pending.shift()!);
    }
  }
}

export function showAchievementToast(payload: AchievementToastPayload) {
  if (showListener) {
    showListener(payload);
    return;
  }
  pending.push(payload);
}

export function clearAchievementToastPending() {
  pending.length = 0;
}
