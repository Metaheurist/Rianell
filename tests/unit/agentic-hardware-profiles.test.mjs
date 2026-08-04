import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyProfile,
  applyProfileOverride,
  listSelectableProfiles,
  loadHardwareProfiles,
} from '../../scripts/dev/probe-hardware-profile.mjs';
import { resolvePackModel } from '../../scripts/dev/agentic-pipeline/catalog.mjs';

test('hardware profile catalog lists universal presets', () => {
  const cat = loadHardwareProfiles();
  const ids = listSelectableProfiles(cat).map((p) => p.id);
  for (const id of [
    'auto', 'cpu_only', 'single_8', 'single_12', 'single_16', 'single_24',
    'dual_12_16', 'dual_balanced', 'workstation_48',
  ]) {
    assert.ok(ids.includes(id), `missing profile ${id}`);
  }
});

test('classifyProfile covers empty, 8/12/16/24, dual, workstation', () => {
  assert.equal(classifyProfile([]).profile, 'cpu_only');
  assert.equal(classifyProfile([{ name: 'A', memGb: 8 }]).profile, 'single_8');
  assert.equal(classifyProfile([{ name: 'A', memGb: 12 }]).profile, 'single_12');
  assert.equal(classifyProfile([{ name: 'A', memGb: 16 }]).profile, 'single_16');
  assert.equal(classifyProfile([{ name: 'A', memGb: 24 }]).profile, 'single_24');
  assert.equal(classifyProfile([{ name: 'A', memGb: 48 }]).profile, 'workstation_48');
  assert.equal(
    classifyProfile([{ name: 'A', memGb: 16 }, { name: 'B', memGb: 12 }]).profile,
    'dual_12_16',
  );
  assert.equal(
    classifyProfile([{ name: 'A', memGb: 12 }, { name: 'B', memGb: 12 }]).profile,
    'dual_balanced',
  );
});

test('manual override replaces auto classification', () => {
  const base = classifyProfile([{ name: 'A', memGb: 16 }]);
  const o = applyProfileOverride(base, 'single_8');
  assert.equal(o.effectiveProfile, 'single_8');
  assert.equal(o.override, 'single_8');
  assert.equal(o.autoWouldBe, 'single_16');
  assert.equal(o.maxModelVramGb, 8);
});

test('resolvePackModel downshifts on tight profile budget', () => {
  const full = resolvePackModel('design');
  assert.equal(full.model, 'qwen3.6:35b');
  const small = resolvePackModel('design', null, undefined, {
    profile: 'single_12',
    maxModelVramGb: 12,
  });
  assert.equal(small.model, 'qwen3:14b');
  assert.equal(small.profileRemapped, true);
});

test('explicit model request is not remapped', () => {
  const r = resolvePackModel('design', 'qwen3.6:35b', undefined, {
    maxModelVramGb: 8,
  });
  assert.equal(r.model, 'qwen3.6:35b');
  assert.equal(r.profileRemapped, false);
});
