# Supabase Edge Function: send Web Push to stored subscriptions (VAPID).
# Deploy separately; set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Supabase secrets.

See [docs/runbooks/llm-rollout.md](../../../docs/runbooks/llm-rollout.md) for payload schema.

Payload: `{ "type": "model_update"|"app_update", "message": "...", "minCacheVersion": "..." }`
