/** Web (PWA) notification content. */

/**
 * @param {{ title?: string, body?: string, data?: object }} content
 */
export function buildNotificationContent(content) {
  return {
    title: content?.title || '',
    body: content?.body || '',
    data: content?.data || {},
  };
}
