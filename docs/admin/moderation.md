# Community moderation (Plan 23 CM4)

Admin review uses Supabase Studio or service-role SQL.

## Pending tips

```sql
SELECT * FROM community_tips WHERE approved = false ORDER BY created_at;
```

## Approve tip

```sql
UPDATE community_tips SET approved = true WHERE id = '<uuid>';
```

## Reject tip

```sql
DELETE FROM community_tips WHERE id = '<uuid>';
```

## Pending triggers

```sql
SELECT * FROM community_triggers WHERE approved = false ORDER BY created_at;
```

k≥5 is enforced in `get_community_triggers` RPC - triggers with `contributor_count < 5` are not returned to clients.
