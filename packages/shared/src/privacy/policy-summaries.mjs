/** Plain-language policy summaries for in-app viewer (offline). @deprecated Prefer locale-packs `policy.*` keys via getPolicyDocumentsI18n. */
export const POLICY_SUMMARIES = {
  'global-baseline': {
    id: 'global-baseline',
    title: 'Global privacy baseline',
    summary:
      'Rianell stores health logs on your device by default. Cloud backup, anonymised research contribution, and on-device AI are optional and require separate consent. You can export or delete your data at any time.',
  },
  'eu-gdpr': {
    id: 'eu-gdpr',
    title: 'EEA & UK — GDPR',
    summary:
      'Health data is special-category data under GDPR Art. 9. We rely on your explicit consent to process it locally and for optional cloud, research, and AI features. You have rights of access, rectification, erasure, restriction, portability, and objection.',
  },
  'data-subject-rights': {
    id: 'data-subject-rights',
    title: 'Your data rights',
    summary:
      'You may download a copy of your health logs, request correction, withdraw consent, or delete local and cloud data from Settings. Contact the operator for formal data-subject requests.',
  },
  'other-jurisdictions-us-ca': {
    id: 'other-jurisdictions-us-ca',
    title: 'California (CCPA/CPRA)',
    summary:
      'We do not sell personal information. California residents have rights to know, delete, and correct personal information. Health logs are consumer wellness data, not HIPAA-covered provider records unless you use Rianell under a healthcare BAA.',
  },
  'other-jurisdictions-us': {
    id: 'other-jurisdictions-us',
    title: 'United States — other states',
    summary:
      'Consumer wellness self-tracking is generally outside HIPAA unless you are a covered entity or business associate. State privacy laws may grant access and deletion rights similar to our global baseline.',
  },
  'other-jurisdictions-au': {
    id: 'other-jurisdictions-au',
    title: 'Australia — APPs',
    summary:
      'Australian Privacy Principles apply to personal information we hold. You may access and correct your data. Notifiable data breach rules apply to serious incidents affecting your information.',
  },
  'other-jurisdictions-br': {
    id: 'other-jurisdictions-br',
    title: 'Brazil — LGPD',
    summary:
      'LGPD grants rights of confirmation, access, correction, anonymisation, portability, and deletion. Consent is the primary legal basis for health-related processing in the app.',
  },
};
