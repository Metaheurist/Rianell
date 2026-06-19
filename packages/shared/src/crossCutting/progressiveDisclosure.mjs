/** Plan 14 X14.3 — progressive disclosure schedule (L1/S2/S5). */

export const PROGRESSIVE_DISCLOSURE_MILESTONES = [
  { id: 'day1', labelKey: 'progressiveDisclosure.milestone.day1', unlockDay: 0 },
  { id: 'week2', labelKey: 'progressiveDisclosure.milestone.week2', unlockDay: 14 },
  { id: 'month2', labelKey: 'progressiveDisclosure.milestone.month2', unlockDay: 60 },
  { id: 'pool', labelKey: 'progressiveDisclosure.milestone.pool', unlockDay: 90, optional: true },
];

export const ON_DEVICE_MOAT_BULLET_KEYS = [
  'onDeviceMoat.bullet.localInference',
  'onDeviceMoat.bullet.noCloudLlmDefault',
  'onDeviceMoat.bullet.poolOptIn',
  'onDeviceMoat.bullet.localOnly',
];

export function getProgressiveDisclosureMilestones() {
  return PROGRESSIVE_DISCLOSURE_MILESTONES;
}

export function getOnDeviceMoatBulletKeys() {
  return ON_DEVICE_MOAT_BULLET_KEYS;
}
