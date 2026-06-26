/** Plan 18 API5 — webhook payload builder for client fire-and-forget delivery. */

/**
 * @param {object} opts
 * @param {string} opts.event
 * @param {string} opts.logDate
 * @param {string} opts.userId
 */
export function buildWebhookInvokePayload({ event, logDate, userId }) {
  return {
    event: String(event || 'log.created'),
    log_date: String(logDate || ''),
    user_id: String(userId || ''),
    ts: Date.now(),
  };
}

export async function invokeDeliverWebhook(supabase, payload) {
  if (!supabase || typeof supabase.functions?.invoke !== 'function') return;
  try {
    await supabase.functions.invoke('deliver-webhook', { body: payload });
  } catch {
    /* fire-and-forget */
  }
}
