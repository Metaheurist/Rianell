import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  return new Response(JSON.stringify({ access_token: 'stub', token_type: 'bearer' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
