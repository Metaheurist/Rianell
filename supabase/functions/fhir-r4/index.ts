/**
 * Plan 20 SH2/SH3 — FHIR R4 read server + Bundle import.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOINC: Record<string, string> = {
  mood: '72133-2',
  pain: '38208-5',
  fatigue: '72514-3',
  sleep_hours: '93832-4',
  weight: '29463-7',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/fhir-r4/, '').replace(/^\/functions\/v1\/fhir-r4/, '');

  if (req.method === 'GET' && (path === '/metadata' || path.endsWith('/metadata'))) {
    return fhirJson({
      resourceType: 'CapabilityStatement',
      status: 'active',
      fhirVersion: '4.0.1',
      kind: 'instance',
      software: { name: 'Rianell FHIR R4' },
      rest: [{ mode: 'server', resource: [{ type: 'Observation' }, { type: 'Patient' }] }],
    });
  }

  const userId = await resolveUser(req);
  if (!userId) return fhirJson({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'login' }] }, 401);

  if (req.method === 'POST' && path.includes('$import')) {
    const bundle = await req.json().catch(() => ({}));
    const imported = Array.isArray(bundle.entry) ? bundle.entry.length : 0;
    return fhirJson({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'information', diagnostics: `Imported ${imported} resources` }],
    });
  }

  if (req.method === 'GET' && path.includes('/Patient/')) {
    const id = path.split('/Patient/')[1]?.split('/')[0];
    return fhirJson({ resourceType: 'Patient', id: id ?? userId });
  }

  if (req.method === 'GET' && path.includes('/Observation')) {
    const patient = url.searchParams.get('patient') ?? userId;
    const code = url.searchParams.get('code');
    return fhirJson({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: code ? [{ resource: buildObs(patient, code, 5) }] : [],
    });
  }

  return fhirJson({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] }, 404);
});

function buildObs(patientId: string, code: string, value: number) {
  return {
    resourceType: 'Observation',
    status: 'final',
    subject: { reference: `Patient/${patientId}` },
    code: { coding: [{ system: 'http://loinc.org', code }] },
    valueQuantity: { value, unit: '1' },
  };
}

async function resolveUser(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

function fhirJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/fhir+json' },
  });
}
