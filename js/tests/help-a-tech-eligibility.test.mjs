#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import { isDiscussionEligibleForHelpATech } from '../src/forum/utils/helpATechEligibility.js';

function createViewer({ id = 1, admin = true } = {}) {
  return {
    id: () => id,
    isAdmin: () => admin,
  };
}

function createDiscussion({
  id = 101,
  title = '2019 F-150 3.5L EcoBoost Phasers',
  canReply = true,
  isHidden = false,
  isLocked = false,
  isDeleted = false,
  userId = 42,
  tags = ['ford'],
} = {}) {
  return {
    id: () => id,
    title: () => title,
    canReply: () => canReply,
    isHidden: () => isHidden,
    isLocked: () => isLocked,
    isDeleted: () => isDeleted,
    user: () => ({ id: () => userId }),
    tags: () => tags.map((t) => (typeof t === 'string' ? { slug: () => t } : t)),
  };
}

const fordContext = {
  type: 'brand',
  slug: 'ford',
  board: { name: 'Ford', slug: 'ford' },
};

const techTopicsContext = {
  type: 'technician-topics',
  slug: 'general-shop-discussion',
  label: 'Technician Topics',
};

test('ELIGIBILITY: fully valid candidate passes for admin viewer', () => {
  const viewer = createViewer();
  const discussion = createDiscussion();
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), true);
});

test('ELIGIBILITY: non-admin member is rejected (fail closed)', () => {
  const viewer = createViewer({ admin: false });
  const discussion = createDiscussion();
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: guest viewer is rejected (null viewer)', () => {
  const discussion = createDiscussion();
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer: null, context: fordContext }), false);
});

test('ELIGIBILITY: canReply false is rejected', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ canReply: false });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: canReply undefined or missing is rejected (fail closed)', () => {
  const viewer = createViewer();
  const discussion = {
    id: () => 101,
    title: () => '2019 F-150',
    canReply: () => undefined,
    isHidden: () => false,
    isLocked: () => false,
    isDeleted: () => false,
    user: () => ({ id: () => 42 }),
    tags: () => [{ slug: () => 'ford' }],
  };
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: hidden discussion is rejected', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ isHidden: true });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: locked discussion is rejected', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ isLocked: true });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: deleted discussion is rejected', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ isDeleted: true });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: author cannot be invited to answer their own discussion', () => {
  const viewer = createViewer({ id: 99 });
  const discussion = createDiscussion({ userId: 99 });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: unrelated brand board is rejected', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ tags: ['chevrolet'] });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: child brand tag passes for parent board context', () => {
  const viewer = createViewer();
  const cdjrContext = {
    type: 'brand',
    slug: 'cdjr',
    board: {
      name: 'CDJR',
      slug: 'cdjr',
      children: [
        { name: 'Chrysler', slug: 'chrysler' },
        { name: 'Dodge', slug: 'dodge' },
        { name: 'Jeep', slug: 'jeep' },
        { name: 'Ram', slug: 'ram' },
      ],
    },
  };
  const ramDiscussion = createDiscussion({ tags: ['ram'] });
  assert.equal(isDiscussionEligibleForHelpATech(ramDiscussion, { viewer, context: cdjrContext }), true);
});

test('ELIGIBILITY: technician topics context accepts general-shop-discussion', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ tags: ['general-shop-discussion'] });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: techTopicsContext }), true);
});

test('ELIGIBILITY: missing or blank title fails closed', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ title: '   ' });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: missing id fails closed', () => {
  const viewer = createViewer();
  const discussion = createDiscussion({ id: null });
  assert.equal(isDiscussionEligibleForHelpATech(discussion, { viewer, context: fordContext }), false);
});
