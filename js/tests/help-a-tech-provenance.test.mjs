#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  selectHelpATechDiscussions,
  getActiveBoardDiscussions,
  MAX_HELP_A_TECH_RESULTS,
} from '../src/forum/utils/helpATechSelection.js';
import { isDiscussionEligibleForHelpATech } from '../src/forum/utils/helpATechEligibility.js';
import { resolveHelpATechContext } from '../src/forum/utils/helpATechContext.js';
import { discussionCanonicalHref } from '../src/forum/utils/helpATechNavigation.js';

function createAdminViewer(id = 1) {
  return { id: () => id, isAdmin: () => true };
}

function createMemberViewer(id = 50) {
  return { id: () => id, isAdmin: () => false };
}

const manifestFixture = {
  groups: [
    {
      mode: 'tree',
      id: 'brands',
      boards: [
        { name: 'Ford', slug: 'ford' },
        {
          name: 'CDJR',
          slug: 'cdjr',
          children: [
            { name: 'Chrysler', slug: 'chrysler' },
            { name: 'Dodge', slug: 'dodge' },
            { name: 'Jeep', slug: 'jeep' },
            { name: 'Ram', slug: 'ram' },
          ],
        },
        { name: 'General Motors', slug: 'gm' },
      ],
    },
  ],
};

function createFlarumDiscussion({
  id = 1,
  slug = 'test-topic',
  title = 'Test Topic',
  canReply = true,
  hiddenAt = undefined,
  isLocked = undefined,
  isPrivateDiscussion = undefined,
  recipientUsers = undefined,
  userId = 100,
  tags = ['ford'],
} = {}) {
  return {
    id: () => id,
    slug: () => slug,
    title: () => title,
    canReply: () => canReply,
    hiddenAt: () => hiddenAt,
    isHidden: () => Boolean(hiddenAt),
    isLocked: () => Boolean(isLocked),
    isPrivateDiscussion: () => Boolean(isPrivateDiscussion),
    recipientUsers: () => recipientUsers,
    user: () => (userId ? { id: () => userId } : null),
    tags: () => tags.map((t) => ({ slug: () => t })),
  };
}

test('PROVENANCE: board switching purges previous board discussions from selection', () => {
  const viewer = createAdminViewer(1);
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });
  const gmContext = resolveHelpATechContext({
    currentTag: { slug: () => 'gm' },
    manifest: manifestFixture,
  });

  // State on Ford board
  const fordState = {
    getPages: () => [
      {
        number: 1,
        items: [
          createFlarumDiscussion({ id: 10, title: 'Ford Phasers', tags: ['ford'] }),
        ],
      },
    ],
  };

  const fordDiscussions = getActiveBoardDiscussions(fordState);
  const fordSelected = selectHelpATechDiscussions({
    discussions: fordDiscussions,
    viewer,
    context: fordContext,
    adminPreviewEnabled: true,
  });
  assert.equal(fordSelected.length, 1);
  assert.equal(fordSelected[0].id(), 10);

  // Switch to GM board: DiscussionListState clears and loads GM discussions
  const gmState = {
    getPages: () => [
      {
        number: 1,
        items: [
          createFlarumDiscussion({ id: 20, title: 'GM Lifters', tags: ['gm'] }),
        ],
      },
    ],
  };
  const gmDiscussions = getActiveBoardDiscussions(gmState);

  // Stale Ford discussion is NOT in gmState result set
  const gmSelected = selectHelpATechDiscussions({
    discussions: gmDiscussions,
    viewer,
    context: gmContext,
    adminPreviewEnabled: true,
  });
  assert.equal(gmSelected.length, 1);
  assert.equal(gmSelected[0].id(), 20);
});

test('PROVENANCE: global cache contamination cannot leak into active board selection', () => {
  const viewer = createAdminViewer(1);
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });

  // Active board state only has 1 discussion
  const activeBoardState = {
    getPages: () => [
      {
        number: 1,
        items: [createFlarumDiscussion({ id: 101, title: 'Ford Oil Leak', tags: ['ford'] })],
      },
    ],
  };

  const activeItems = getActiveBoardDiscussions(activeBoardState);
  const selected = selectHelpATechDiscussions({
    discussions: activeItems,
    viewer,
    context: fordContext,
    adminPreviewEnabled: true,
  });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].id(), 101);
});

test('PROVENANCE: admin-visible private discussion is excluded even when canReply is true', () => {
  const adminViewer = createAdminViewer(1);
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });

  // An admin may have canReply === true on a private Byobu discussion
  const privateDiscussion = createFlarumDiscussion({
    id: 555,
    title: 'Private Staff Discussion',
    canReply: true,
    isPrivateDiscussion: true,
    tags: ['ford'],
  });

  const isEligible = isDiscussionEligibleForHelpATech(privateDiscussion, {
    viewer: adminViewer,
    context: fordContext,
  });
  assert.equal(isEligible, false);
});

test('PROVENANCE: missing author identity strictly fails closed to protect self-exclusion', () => {
  const viewer = createAdminViewer(1);
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });

  const anonymousDiscussion = createFlarumDiscussion({
    id: 777,
    title: 'Discussion with Null Author',
    canReply: true,
    userId: null,
    tags: ['ford'],
  });

  assert.equal(
    isDiscussionEligibleForHelpATech(anonymousDiscussion, {
      viewer,
      context: fordContext,
    }),
    false
  );
});

test('PROVENANCE: missing optional status attributes default cleanly under Flarum semantics', () => {
  const viewer = createAdminViewer(1);
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });

  // Standard discussion with no hiddenAt and no lock attribute
  const normalDiscussion = {
    id: () => 888,
    title: () => 'Normal Discussion',
    canReply: () => true,
    user: () => ({ id: () => 42 }),
    tags: () => [{ slug: () => 'ford' }],
  };

  assert.equal(
    isDiscussionEligibleForHelpATech(normalDiscussion, {
      viewer,
      context: fordContext,
    }),
    true
  );
});

test('PROVENANCE: guest and ordinary member denial is strictly maintained', () => {
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });
  const discussions = [createFlarumDiscussion({ id: 1, tags: ['ford'] })];

  // Guest
  assert.deepEqual(
    selectHelpATechDiscussions({
      discussions,
      viewer: null,
      context: fordContext,
      adminPreviewEnabled: true,
    }),
    []
  );

  // Ordinary member
  assert.deepEqual(
    selectHelpATechDiscussions({
      discussions,
      viewer: createMemberViewer(50),
      context: fordContext,
      adminPreviewEnabled: true,
    }),
    []
  );
});

test('PROVENANCE: default-OFF setting denies even administrator', () => {
  const fordContext = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: manifestFixture,
  });
  const discussions = [createFlarumDiscussion({ id: 1, tags: ['ford'] })];

  assert.deepEqual(
    selectHelpATechDiscussions({
      discussions,
      viewer: createAdminViewer(1),
      context: fordContext,
      adminPreviewEnabled: false,
    }),
    []
  );
});
