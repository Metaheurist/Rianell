# Strava connector

Imports activities into daily log `exercise[]` fields.

- **OAuth:** `activity:read_all`
- **API:** `GET /api/v3/athlete/activities?after={unix}&per_page=30`
- **Rate limits:** ~200 requests / 15 min (document in operator monitoring)
- **Setup:** [SETUP.md](./SETUP.md) §1
