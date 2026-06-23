# Delete user data (GDPR Art. 17)

Edge Function pattern for hard erasure after `delete_all_user_data` RPC.

## Deploy

1. Apply `supabase/Schema.sql` (includes `delete_all_user_data(uuid)`).
2. Deploy: `supabase functions deploy delete-user-data --no-verify-jwt` (invoke with service role only).
3. Set secrets: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

## Invoke (operator / authenticated erasure flow)

```http
POST /functions/v1/delete-user-data
Authorization: Bearer <user-jwt-or-service-role>
Content-Type: application/json

{ "userId": "<uuid>", "shouldSoftDelete": false }
```

The function calls `delete_all_user_data` then `auth.admin.deleteUser(userId, shouldSoftDelete: false)`.

## Client

PWA/RN `deleteAllUserDataFromCloud` deletes per-table rows via RLS; operators can run the Edge Function for full auth user removal.
