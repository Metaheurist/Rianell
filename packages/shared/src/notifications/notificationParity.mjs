/** Platform-specific notification content (Plan 15 FC7). */

/**
 * @param {'ios'|'android'|'web'} platform
 * @param {{ title?: string, body?: string, channelId?: string, badge?: number }} content
 */
export function buildNotificationContent(platform, content) {
  const base = {
    title: content?.title || '',
    body: content?.body || '',
  };
  if (platform === 'ios') {
    return { ...base, sound: true, badge: typeof content?.badge === 'number' ? content.badge : 1 };
  }
  if (platform === 'android') {
    return { ...base, channelId: content?.channelId || 'health-reminders' };
  }
  return { ...base, data: content?.data || {} };
}
