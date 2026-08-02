# Agentic API client

```js
import { createAgenticClient, assertLoopbackBaseUrl } from '@rianell/build-tools/agentic-api-client';

const client = createAgenticClient({ baseUrl: 'http://127.0.0.1:8080' });
await client.getHealth();
await client.runAll({ dryRun: true });
await client.startPack('security', { dryRun: true });
```

- Node refuses non-loopback `baseUrl`.
- Browser uses same-origin `/api/agentic`.
- Validates `schemaVersion` envelope before returning `data`.
