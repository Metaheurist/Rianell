/** Lighthouse CI budgets — https://github.com/GoogleChrome/lighthouse-ci */
module.exports = {
  ci: {
    collect: {
      // Match benchmarks/github-pages (median of 3) — single runs spike on CI runners.
      numberOfRuns: 5,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
        // Let PWA shell/fonts settle; LHCI on cold runners spikes CLS without this.
        pauseAfterLoadMs: 6500,
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // Median TBT on Pages probe is ~350ms (see benchmarks/github-pages/history.json).
        'total-blocking-time': ['error', { maxNumericValue: 450 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'benchmarks/lighthouse-ci',
    },
  },
};
