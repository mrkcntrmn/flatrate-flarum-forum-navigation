#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import { selectHelpATechDiscussions, MAX_HELP_A_TECH_RESULTS } from '../src/forum/utils/helpATechSelection.js';

function createViewer({ id = 1, admin = true } = {}) {
  return {
    id: () => id,
    isAdmin: () => admin,
  };
}

const context = {
  type: 'brand',
  slug: 'toyota',
  board: { name: 'Toyota', slug: 'toyota' },
};

function createItem(id, replyCount = 0, createdAt = '2026-10-01T12:00:00Z') {
  return {
    id: () => id,
    title: () => `Discussion ${id}`,
    canReply: () => true,
    isHidden: () => false,
    isLocked: () => false,
    isDeleted: () => false,
    replyCount: () => replyCount,
    createdAt: () => createdAt,
    user: () => ({ id: () => 999 }),
    tags: () => [{ slug: () => 'toyota' }],
  };
}

test('SELECTION: returns [] when 0 discussions provided', () => {
  const viewer = createViewer();
  const selected = selectHelpATechDiscussions({
    discussions: [],
    viewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.deepEqual(selected, []);
});

test('SELECTION: returns exactly 1 item when 1 eligible exists', () => {
  const viewer = createViewer();
  const selected = selectHelpATechDiscussions({
    discussions: [createItem(1, 0)],
    viewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id(), 1);
});

test('SELECTION: returns exactly 2 items when 2 eligible exist', () => {
  const viewer = createViewer();
  const selected = selectHelpATechDiscussions({
    discussions: [createItem(1, 0), createItem(2, 1)],
    viewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.equal(selected.length, 2);
});

test('SELECTION: returns exactly 3 items when 3 eligible exist', () => {
  const viewer = createViewer();
  const selected = selectHelpATechDiscussions({
    discussions: [createItem(1, 0), createItem(2, 1), createItem(3, 2)],
    viewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.equal(selected.length, 3);
});

test('SELECTION: strictly caps at 3 when 4 or more eligible exist', () => {
  const viewer = createViewer();
  const candidates = [
    createItem(1, 5),
    createItem(2, 1),
    createItem(3, 0),
    createItem(4, 3),
    createItem(5, 2),
  ];
  const selected = selectHelpATechDiscussions({
    discussions: candidates,
    viewer,
    context,
    adminPreviewEnabled: true,
  });
  assert.equal(selected.length, MAX_HELP_A_TECH_RESULTS);
  assert.equal(selected.length, 3);
});

test('SELECTION: sorts deterministically by fewest replies first', () => {
  const viewer = createViewer();
  const candidates = [
    createItem(1, 8),
    createItem(2, 1),
    createItem(3, 0),
    createItem(4, 4),
  ];
  const selected = selectHelpATechDiscussions({
    discussions: candidates,
    viewer,
    context,
    adminPreviewEnabled: true,
  });

  // Expected order: item 3 (0 replies), item 2 (1 reply), item 4 (4 replies)
  assert.equal(selected.length, 3);
  assert.equal(selected[0].id(), 3);
  assert.equal(selected[1].id(), 2);
  assert.equal(selected[2].id(), 4);
});

test('SELECTION: breaks reply ties by newest creation date', () => {
  const viewer = createViewer();
  const candidates = [
    createItem(1, 0, '2026-10-01T10:00:00Z'),
    createItem(2, 0, '2026-10-05T10:00:00Z'), // newer
    createItem(3, 0, '2026-10-03T10:00:00Z'),
  ];
  const selected = selectHelpATechDiscussions({
    discussions: candidates,
    viewer,
    context,
    adminPreviewEnabled: true,
  });

  assert.equal(selected[0].id(), 2); // 2026-10-05
  assert.equal(selected[1].id(), 3); // 2026-10-03
  assert.equal(selected[2].id(), 1); // 2026-10-01
});
