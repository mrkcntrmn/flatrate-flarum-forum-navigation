#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import { selectHelpATechDiscussions, getActiveBoardDiscussions, MAX_HELP_A_TECH_RESULTS } from '../src/forum/utils/helpATechSelection.js';

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

test('SELECTION: preserves native ordering from active board result set', () => {
  const viewer = createViewer();
  const candidates = [
    createItem(10, 8),
    createItem(20, 1),
    createItem(30, 0),
    createItem(40, 4),
  ];
  const selected = selectHelpATechDiscussions({
    discussions: candidates,
    viewer,
    context,
    adminPreviewEnabled: true,
  });

  // Native ordering is preserved: items 10, 20, 30 (first 3 candidates)
  assert.equal(selected.length, 3);
  assert.equal(selected[0].id(), 10);
  assert.equal(selected[1].id(), 20);
  assert.equal(selected[2].id(), 30);
});

test('SELECTION: getActiveBoardDiscussions extracts items across loaded pages', () => {
  const mockState = {
    getPages: () => [
      { number: 1, items: [createItem(1), createItem(2)] },
      { number: 2, items: [createItem(3)] },
    ],
  };
  const extracted = getActiveBoardDiscussions(mockState);
  assert.equal(extracted.length, 3);
  assert.equal(extracted[0].id(), 1);
  assert.equal(extracted[1].id(), 2);
  assert.equal(extracted[2].id(), 3);
});

test('SELECTION: getActiveBoardDiscussions returns [] on empty or invalid state', () => {
  assert.deepEqual(getActiveBoardDiscussions(null), []);
  assert.deepEqual(getActiveBoardDiscussions({}), []);
  assert.deepEqual(getActiveBoardDiscussions({ getPages: () => [] }), []);
});

