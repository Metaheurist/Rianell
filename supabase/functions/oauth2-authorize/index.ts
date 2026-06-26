import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  return new Response(JSON.stringify({ authorize: true, path: url.pathname }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
