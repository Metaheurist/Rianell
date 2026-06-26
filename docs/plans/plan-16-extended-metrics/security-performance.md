# Plan 16 — Security & performance

## Security

- **VM11 photos:** `health-photos` bucket is **private**; RLS restricts select/insert/delete to `auth.uid()` folder prefix.
- **VM9 gratitude:** excluded from anonymized research pool (free-text, private).
- **VM8 painLocations:** structured regions only; no free-text body notes in array.
- Photo URLs must be `https://` or `health-photos/` storage paths after normalize.

## Performance

- Chart series for VM1/2/3/5 use existing lazy-chart loader; no extra preload on Home.
- Photo upload is async on file select; wizard save is not blocked beyond in-flight uploads.
