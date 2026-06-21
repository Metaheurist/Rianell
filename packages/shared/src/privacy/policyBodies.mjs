/** Plan 05 P1 — extended policy body paragraphs (plain text, offline). */

export const POLICY_BODIES = {
  'global-baseline': [
    'Rianell is a personal wellness tracker. Your health logs are stored on your device unless you turn on optional cloud backup.',
    'Optional features (encrypted cloud backup, anonymised research contribution, on-device AI, and optional session recording) each need separate consent. You can change or withdraw consent in Settings.',
    'Session recording (Smartlook) is on by default after onboarding. You are notified during setup and can opt out immediately or later in Settings. When enabled, anonymised session data is used only for heatmaps and error tracking in the EU—not for reviewing your health screens. You can turn it off at any time under Settings → Privacy.',
    'You can export your data or delete local and cloud copies at any time from Settings → Data options.',
  ],
  'eu-gdpr': [
    'Under GDPR Article 9, health-related data is special-category data. We rely on your explicit consent to process logs on your device and for any optional cloud, research, or AI features.',
    'You have the right to access, rectify, erase, restrict, port, and object to processing. Withdraw consent in Settings; this does not affect lawfulness of processing before withdrawal.',
    'Our operator acts as controller for account and cloud data. Sub-processors are listed in the privacy pack hosted with the app.',
  ],
  'data-subject-rights': [
    'Download a copy of your logs via Settings → Export. Correct entries in the log wizard or View logs.',
    'Delete local data from Settings → Clear all data. Delete cloud backup separately via Delete cloud data when signed in.',
    'For formal data-subject requests beyond in-app tools, contact the operator using the details in SECURITY.md.',
  ],
  'other-jurisdictions-us-ca': [
    'We do not sell personal information. California residents may request to know, delete, and correct personal information we hold.',
    'Rianell is consumer wellness self-tracking, not a HIPAA-covered medical record unless used under a healthcare business associate agreement.',
  ],
  'other-jurisdictions-us': [
    'State privacy laws may grant access and deletion rights similar to our global baseline. Health logs stay on your device by default.',
  ],
  'other-jurisdictions-au': [
    'Australian Privacy Principles apply to personal information we hold. You may access and correct your data through in-app export and edit tools.',
    'Notifiable data breach rules apply to serious incidents affecting your information held by the operator.',
  ],
  'other-jurisdictions-br': [
    'LGPD grants confirmation, access, correction, anonymisation, portability, and deletion rights. Consent is the primary basis for health-related processing in the app.',
  ],
};

export function getPolicyBodyParagraphs(docId) {
  const rows = POLICY_BODIES[docId];
  return Array.isArray(rows) ? rows.slice() : [];
}
