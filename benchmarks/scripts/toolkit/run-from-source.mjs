/**
 * Lighthouse + load on source-built slug (tier-3 desktop default context).
 */
import { runWebProfile } from '../lib/run-web-profile.mjs';
import { prepareSite } from './prepare-site.mjs';

async function main() {
  prepareSite();
  await runWebProfile({
    slug: 'source-built',
    title: 'Source-built PWA (tier-3 desktop baseline)',
    note: 'Lighthouse on static dist; tier matrix uses Playwright injection separately.',
  });
  console.log('source-built benchmarks written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
