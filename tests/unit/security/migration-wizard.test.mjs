import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCloudSyncBlockedByMigration,
  applyMigrationPendingFlag,
} from '../../../packages/shared/src/privacy/migrationState.mjs';
import { getResidencyChooserOptions } from '../../../packages/shared/src/privacy/residency-registry.mjs';

test('single-project mode never blocks cloud sync for migration', () => {
  assert.equal(isCloudSyncBlockedByMigration({ migrationPending: true }), false);
});

test('applyMigrationPendingFlag clears pending flag', () => {
  const next = applyMigrationPendingFlag({ migrationPending: true });
  assert.equal(next.migrationPending, false);
});

test('residency chooser disabled in single-project mode', () => {
  assert.equal(getResidencyChooserOptions('other').length, 0);
});
