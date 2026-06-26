import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Plan 21 SEC5 — CSP violation report endpoint (returns 204). */
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(null, { status: 405 });
  }
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/csp-report') && !contentType.includes('application/json')) {
    return new Response(null, { status: 415 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const report = body['csp-report'] || body;
  const url = report['document-uri'] || report.url || '';
  const directive = report['violated-directive'] || report.directive || '';
  const blocked = report['blocked-uri'] || report.blocked_uri || '';

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);
  await supabase.from('csp_violations').insert({ url, directive, blocked_uri: blocked });

  return new Response(null, { status: 204 });
});
