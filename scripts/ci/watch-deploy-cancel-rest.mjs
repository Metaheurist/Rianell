import { execSync } from 'child_process';

const runId = process.argv[2] || process.env.GH_RUN_ID;
if (!runId) {
  console.error('Usage: node scripts/ci/watch-deploy-cancel-rest.mjs <run-id>');
  process.exit(1);
}

function ghJson(args) {
  const out = execSync(`gh ${args}`, { encoding: 'utf8' });
  return JSON.parse(out);
}

function jobLine(jobs) {
  return jobs
    .filter((j) => /Deploy to GitHub Pages|Prepare minified|Unit tests|Security/.test(j.name))
    .map((j) => `${j.name}: ${j.status}${j.conclusion ? ` (${j.conclusion})` : ''}`)
    .join(' | ');
}

console.log(`Watching run ${runId} for Deploy to GitHub Pages...`);

for (let i = 0; i < 80; i++) {
  const data = ghJson(`run view ${runId} --json jobs,status,conclusion`);
  const deploy = data.jobs.find((j) => j.name === 'Deploy to GitHub Pages');
  console.log(new Date().toISOString().slice(11, 19), jobLine(data.jobs));

  if (deploy?.conclusion === 'success') {
    console.log('Deploy succeeded — cancelling remaining jobs to save credits.');
    try {
      execSync(`gh run cancel ${runId}`, { stdio: 'inherit' });
      console.log('Run cancelled.');
    } catch (e) {
      console.log('Cancel returned non-zero (run may already be finishing):', e.message);
    }
    process.exit(0);
  }

  if (deploy?.conclusion === 'failure' || deploy?.conclusion === 'cancelled') {
    console.error('Deploy failed:', deploy.conclusion);
    process.exit(1);
  }

  if (data.status === 'completed' && !deploy) {
    console.error('Run completed but deploy job not found.');
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 15000));
}

console.error('Timed out waiting for deploy.');
process.exit(1);
