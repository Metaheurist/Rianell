# Fasten Health compatibility (Plan 20 SH5)

Rianell exposes a FHIR R4 server compatible with [Fasten Health](https://github.com/fastenhealth/fasten-onprem) read connectors.

## Connect

1. Deploy Rianell API (Supabase `fhir-r4` function or self-hosted `http://host:8081/fhir/r4`).
2. In Fasten, add a **custom FHIR source**:
   - Base URL: `https://<project>.supabase.co/functions/v1/fhir-r4`
   - Auth: Bearer token (API key from Rianell Developer settings)
3. Run Fasten's connection test against `/metadata`.

Supported read resources: `Patient`, `Observation`, `MedicationStatement`, `Condition`.
