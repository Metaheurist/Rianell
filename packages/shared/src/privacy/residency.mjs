const DEFAULT_RESIDENCY = {
  code: 'default',
  label: 'Operator default region',
  regionLabel: 'See subprocessors documentation',
  projectUrl: '',
};

export function getResidencyConfigFromEnv(env = {}) {
  const code = env.RIANELL_DATA_RESIDENCY_CODE || env.DATA_RESIDENCY_CODE || 'default';
  const label = env.RIANELL_DATA_RESIDENCY_LABEL || env.DATA_RESIDENCY_LABEL || DEFAULT_RESIDENCY.label;
  const regionLabel = env.RIANELL_DATA_RESIDENCY_REGION || env.DATA_RESIDENCY_REGION || DEFAULT_RESIDENCY.regionLabel;
  const projectUrl = env.SUPABASE_URL || env.RIANELL_SUPABASE_URL || '';
  return { code, label, regionLabel, projectUrl };
}

export function getResidencyDisplayLabel(config) {
  const c = config || DEFAULT_RESIDENCY;
  if (c.regionLabel && c.regionLabel !== DEFAULT_RESIDENCY.regionLabel) {
    return `${c.label} (${c.regionLabel})`;
  }
  return c.label;
}
