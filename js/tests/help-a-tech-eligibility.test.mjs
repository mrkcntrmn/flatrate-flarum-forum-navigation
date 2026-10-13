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

test('ELIGIBILITY: missing author identity fails closed (Finding H1-R1-04)', () => {
  const viewer = createViewer({ id: 99 });
  const discussionWithoutAuthor = {
    id: () => 101,
    title: () => '2019 F-150',
    canReply: () => true,
    user: () => null, // Author identity unavailable
    tags: () => [{ slug: () => 'ford' }],
  };
  assert.equal(
    isDiscussionEligibleForHelpATech(discussionWithoutAuthor, { viewer, context: fordContext }),
    false
  );
});

test('ELIGIBILITY: private discussions are excluded (Finding H1-R1-03)', () => {
  const viewer = createViewer();
  const privateDiscussion = createDiscussion();
  privateDiscussion.isPrivateDiscussion = () => true;
  assert.equal(isDiscussionEligibleForHelpATech(privateDiscussion, { viewer, context: fordContext }), false);

  const byobuDiscussion = createDiscussion();
  byobuDiscussion.recipientUsers = () => [{ id: () => 50 }];
  assert.equal(isDiscussionEligibleForHelpATech(byobuDiscussion, { viewer, context: fordContext }), false);

  const groupDiscussion = createDiscussion();
  groupDiscussion.recipientGroups = () => [{ id: () => 3 }];
  assert.equal(isDiscussionEligibleForHelpATech(groupDiscussion, { viewer, context: fordContext }), false);
});

test('ELIGIBILITY: realistic native Flarum serializer model passes (Finding H1-R1-07)', () => {
  const viewer = createViewer();
  // Native Flarum Discussion: canReply is boolean, hiddenAt is undefined when not hidden, isLocked is undefined
  const nativeFlarumDiscussion = {
    id: () => 102,
    title: () => '2020 Silverado 5.3L Lifter Tick',
    canReply: () => true,
    hiddenAt: () => undefined,
    user: () => ({ id: () => 55 }),
    tags: () => [{ slug: () => 'ford' }],
  };
  assert.equal(
    isDiscussionEligibleForHelpATech(nativeFlarumDiscussion, { viewer, context: fordContext }),
    true
  );
});

test('ELIGIBILITY: native Flarum discussion with hiddenAt is rejected (Finding H1-R1-07)', () => {
  const viewer = createViewer();
  const hiddenNativeDiscussion = {
    id: () => 103,
    title: 'Spam Thread',
    canReply: true,
    attribute: (attr) => (attr === 'hiddenAt' ? '2026-10-12T00:00:00Z' : null),
    user: { id: 55 },
    tags: ['ford'],
  };
  assert.equal(
    isDiscussionEligibleForHelpATech(hiddenNativeDiscussion, { viewer, context: fordContext }),
    false
  );
});

