"""FHIR R4 route handlers (Plan 20 SH2)."""
import json
from urllib.parse import urlparse, parse_qs

from .. import config

logger = config.logger

LOINC_MAP = {
    'mood': '72133-2',
    'pain': '38208-5',
    'fatigue': '72514-3',
    'sleep_hours': '93832-4',
    'weight': '29463-7',
}


class FhirRoutesMixin:
    def handle_fhir_r4(self, method='GET'):
        parsed = urlparse(self.path)
        path = parsed.path.replace('/fhir/r4', '') or '/'
        qs = parse_qs(parsed.query)

        if method == 'GET' and path.rstrip('/') == '/metadata':
            body = {
                'resourceType': 'CapabilityStatement',
                'status': 'active',
                'fhirVersion': '4.0.1',
                'kind': 'instance',
                'software': {'name': 'Rianell Python FHIR'},
            }
            self._send_fhir_json(body)
            return

        if method == 'GET' and path.startswith('/Patient/'):
            patient_id = path.split('/Patient/')[1].split('/')[0]
            self._send_fhir_json({'resourceType': 'Patient', 'id': patient_id})
            return

        if method == 'GET' and path.startswith('/Observation'):
            code = (qs.get('code') or [''])[0]
            patient = (qs.get('patient') or ['local'])[0]
            obs = {
                'resourceType': 'Observation',
                'status': 'final',
                'subject': {'reference': f'Patient/{patient}'},
                'code': {'coding': [{'system': 'http://loinc.org', 'code': code or LOINC_MAP['mood']}]},
            }
            self._send_fhir_json({'resourceType': 'Bundle', 'type': 'searchset', 'entry': [{'resource': obs}]})
            return

        if method == 'POST' and '$import' in path:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length) if length else b'{}'
            try:
                bundle = json.loads(raw.decode('utf-8'))
                count = len(bundle.get('entry', []))
            except json.JSONDecodeError:
                count = 0
            self._send_fhir_json({
                'resourceType': 'OperationOutcome',
                'issue': [{'severity': 'information', 'diagnostics': f'Imported {count} resources'}],
            })
            return

        self._send_fhir_json({
            'resourceType': 'OperationOutcome',
            'issue': [{'severity': 'error', 'code': 'not-found'}],
        }, status=404)

    def _send_fhir_json(self, body, status=200):
        payload = json.dumps(body).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/fhir+json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
