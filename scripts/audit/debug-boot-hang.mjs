import fs from 'fs';

const reportPath = process.argv.includes('--from-report')
  ? process.argv[process.argv.indexOf('--from-report') + 1]
  : 'audit-report.json';

if (!fs.existsSync(reportPath)) {
  console.error('No report at', reportPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
console.error('=== debug-boot-hang ===');
console.error('profile:', report.profile);
console.error('ok:', report.ok);
console.error('codes:', report.failureCodes || []);
console.error('warm:', JSON.stringify(report.warm, null, 2));
console.error('guest:', JSON.stringify(report.guest, null, 2));
console.error('postInit:', JSON.stringify(report.postInit, null, 2));
console.error('deploy:', JSON.stringify(report.deploy, null, 2));
