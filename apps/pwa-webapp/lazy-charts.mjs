/** Plan 22 PF2 — lazy-loaded charts chunk marker. */
export async function lazyLoadCharts() {
  if (typeof window !== 'undefined' && window.ApexCharts) return window.ApexCharts;
  return null;
}

export default lazyLoadCharts;
