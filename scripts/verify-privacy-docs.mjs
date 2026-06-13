#!/usr/bin/env node
/**
 * CI guard: required privacy/security documentation exists and ropa.json is valid.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

const requiredFiles = [
  'docs/privacy/global-baseline.md',
  'docs/privacy/eu-gdpr.md',
  'docs/privacy/other-jurisdictions.md',
  'docs/privacy/dpia-health-sync.md',
  'docs/privacy/data-subject-rights.md',
  'docs/privacy/subprocessors.md',
  'docs/privacy/ropa.json',
  'docs/threat-model.md',
  'docs/ai-security.md',
  'docs/incident-response.md',
  'security/rotation-runbook.md',
  'docs/crypto-roadmap.md',
];

let failed = false;

for (const rel of requiredFiles) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`verify-privacy-docs: missing ${rel}`);
    failed = true;
  }
}

const ropaPath = path.join(root, 'docs/privacy/ropa.json');
if (fs.existsSync(ropaPath)) {
  try {
    const ropa = JSON.parse(fs.readFileSync(ropaPath, 'utf8'));
    const activities = ropa.processingActivities || ropa.processing_activities;
    if (!Array.isArray(activities) || activities.length === 0) {
      console.error('verify-privacy-docs: ropa.json must contain processingActivities or processing_activities array');
      failed = true;
    }
    if (!ropa.lastReviewed && !ropa.last_updated) {
      console.warn('verify-privacy-docs: ropa.json missing lastReviewed/last_updated (warn only)');
    }
  } catch (e) {
    console.error('verify-privacy-docs: invalid ropa.json', e.message);
    failed = true;
  }
}

const dpiaPath = path.join(root, 'docs/privacy/dpia-health-sync.md');
if (fs.existsSync(dpiaPath)) {
  const dpia = fs.readFileSync(dpiaPath, 'utf8');
  const dateMatch = dpia.match(/\*\*Review date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const reviewed = new Date(dateMatch[1]);
    const months = (Date.now() - reviewed.getTime()) / (30 * 24 * 3600 * 1000);
    if (months > 12) {
      console.warn('verify-privacy-docs: DPIA review date older than 12 months');
    }
  }
}

if (failed) process.exit(1);
console.log('verify-privacy-docs: all required privacy docs present');
