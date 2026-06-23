# Delete user data (GDPR Art. 17) — Edge Function

Hard erasure: `delete_all_user_data` RPC + `auth.admin.deleteUser`.

## Deploy (Supabase CLI)

```bash
npm install -g supabase
supabase login
cd path/to/Health-app
supabase link --project-ref gitnxgfbbpykwqvogmqq
supabase functions deploy delete-user-data
```

Hosted functions receive `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically — no manual secrets required for those.

## Invoke — signed-in user (self-delete)

```http
POST https://<project-ref>.supabase.co/functions/v1/delete-user-data
Authorization: Bearer <user-access-token>
apikey: <anon-key>
Content-Type: application/json

{ "shouldSoftDelete": false }
```

## Invoke — operator (service role)

```http
POST https://<project-ref>.supabase.co/functions/v1/delete-user-data
Authorization: Bearer <service-role-key>
Content-Type: application/json

{ "userId": "<uuid>", "shouldSoftDelete": false }
```

## Client

PWA/RN `deleteAllUserDataFromCloud()` calls this function when deployed; falls back to per-table RLS deletes if the function returns 404.
