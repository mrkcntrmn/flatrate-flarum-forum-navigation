#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { selectHelpATechDiscussions } from '../src/forum/utils/helpATechSelection.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const helpATechSrc = readFileSync(join(root, 'js/src/forum/components/HelpATech.js'), 'utf8');

const context = {
  type: 'brand',
  slug: 'bmw',
  board: { name: 'BMW', slug: 'bmw' },
};

const candidate = {
  id: () => 10,
  title: () => 'BMW N55 Oil Filter Housing Gasket',
  canReply: () => true,
  isHidden: () => false,
  isLocked: () => false,
  isDeleted: () => false,
  replyCount: () => 0,
  createdAt: () => '2026-10-01T12:00:00Z',
  user: () => ({ id: () => 99 }),
  tags: () => [{ slug: () => 'bmw' }],
};

test('VISIBILITY: setting absent (false) returns empty list', () => {
  const adminViewer = { id: () => 1, isAdmin: () => true };
  const res = selectHelpATechDiscussions({
    discussions: [candidate],
    viewer: adminViewer,
    context,
    adminPreviewEnabled: false,
  });
  assert.deepEqual(res, []);
});

test('VISIBILITY: malformed or null setting returns empty list (fail closed)', () => {
  const adminViewer = { id: () => 1, isAdmin: () => true };
  for (const badSetting of [null, undefined, 'true', '1', 1, 0, 'maybe']) {
    const res = selectHelpATechDiscussions({
      discussions: [candidate],
      viewer: adminViewer,
      context,
      adminPreviewEnabled: badSetting,
    });
    assert.deepEqual(res, [], `Failed to fail-closed on ${badSetting}`);
  }
});

test('VISIBILITY: guest viewer is denied even when flag is true', () => {
  const res = selectHelpATechDiscussions({
    discussions: [candidate],
    viewer: null,
    context,
    adminPreviewEnabled: true,
  });
  assert.deepEqual(res, []);
});

test('VISIBILITY: non-admin member is denied even when flag is true', () => {
  const memberViewer = { id: () => 5, isAdmin: () => false };
  const res = selectHelpATechDiscussions({
    discussions: [candidate],
    viewer: memberViewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.deepEqual(res, []);
});

test('VISIBILITY: admin viewer is granted access when flag is true', () => {
  const adminViewer = { id: () => 1, isAdmin: () => true };
  const res = selectHelpATechDiscussions({
    discussions: [candidate],
    viewer: adminViewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.equal(res.length, 1);
  assert.equal(res[0].id(), 10);
});

test('VISIBILITY: HelpATech component returns null when items array is empty (zero DOM)', () => {
  assert.match(helpATechSrc, /if\s*\(!Array\.isArray\(items\)\s*\|\|\s*items\.length\s*===\s*0\)\s*\{\s*return null;\s*\}/);
});
