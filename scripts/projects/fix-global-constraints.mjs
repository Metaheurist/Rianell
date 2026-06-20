import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projects = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../Projects');
const correctFree = `- **Free tier only** — no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).`;
const correctMobile = `- **Mobile + desktop** — PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).`;

for (const dir of fs.readdirSync(projects)) {
  const planPath = path.join(projects, dir, 'plan.md');
  if (!fs.existsSync(planPath)) continue;
  let text = fs.readFileSync(planPath, 'utf8');
  let fixed = text.replace(
    /- \*\*Free tier only\*\* [\u2014\uFFFD?] no paid APIs\. See \[FREE-TIER-POLICY\.md\]\(\.\.\/FREE-TIER-POLICY\.md\)\./g,
    correctFree
  );
  fixed = fixed.replace(
    /- \*\*Mobile \+ desktop\*\* [\u2014\uFFFD?] PWA \+ RN parity, responsive, max font scale\. See \[UI-UX-STANDARDS\.md\]\(\.\.\/UI-UX-STANDARDS\.md\)\./g,
    correctMobile
  );
  if (fixed !== text) {
    fs.writeFileSync(planPath, fixed, 'utf8');
    console.log('fixed free-tier line:', dir);
  }
}

// MASTER N11
const masterPath = path.join(projects, 'MASTER.md');
let master = fs.readFileSync(masterPath, 'utf8');
master = master.replace(
  /\| N11 \| pending \| \*\*Remote LLM parity on PWA\*\*[^|]*\| M \| [^|]* \|/,
  '| N11 | pending | **Remote LLM parity on PWA** — on-device only | M | No commercial endpoints (FREE-TIER-POLICY) |'
);
fs.writeFileSync(masterPath, master, 'utf8');
console.log('updated MASTER N11');
