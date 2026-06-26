import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
serve(async () => new Response(JSON.stringify({ provider: 'google_sheets', ok: true }), { headers: { 'Content-Type': 'application/json' } }));
