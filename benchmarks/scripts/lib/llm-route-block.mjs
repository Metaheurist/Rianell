/**
 * Playwright route blocker for tier 1–2 (AIEngine-only) matrix runs.
 */

const LLM_SCRIPT_RE = /summary-llm\.js/i;
const LLM_HOST_RE = /huggingface\.co|\.onnx|\/models\//i;

/**
 * @param {import('playwright').Page} page
 * @param {{ enabled?: boolean }} [opts]
 */
export async function installLlmRouteBlock(page, opts = {}) {
  const enabled = opts.enabled ?? process.env.BENCHMARK_BLOCK_LLM === '1';
  if (!enabled) return { enabled: false, blocked: 0 };

  let blocked = 0;
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (LLM_SCRIPT_RE.test(url) || LLM_HOST_RE.test(url)) {
      blocked++;
      await route.abort();
      return;
    }
    await route.continue();
  });
  return { enabled: true, getBlocked: () => blocked };
}

/**
 * @param {import('playwright').Page} page
 */
export async function countLlmNetwork(page) {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('resource') || [];
    let count = 0;
    let scriptLoaded = false;
    for (const e of entries) {
      const n = e.name || '';
      if (/summary-llm\.js/i.test(n)) scriptLoaded = true;
      if (/huggingface\.co|\.onnx|\/models\//i.test(n)) count++;
    }
    return { ai_llm_network_requests: count, ai_llm_script_loaded: scriptLoaded };
  });
}

export function shouldBlockLlmForTier(tier) {
  if (process.env.BENCHMARK_BLOCK_LLM === '1') return true;
  return tier <= 2;
}
