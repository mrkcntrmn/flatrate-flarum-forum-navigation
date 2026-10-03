#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  canMutateDiscussionFollow,
  discussionFollowStarPresentation,
  nextDiscussionFollowSubscription,
} from '../src/forum/utils/discussionFollowState.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const starSrc = readFileSync(join(root, 'js/src/forum/components/DiscussionFollowStar.js'), 'utf8');
const chromeSrc = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const secondarySrc = readFileSync(join(root, 'js/src/forum/components/DiscussionHeroSecondaryActions.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');

test('member follow star uses canonical subscription transitions', () => {
  assert.equal(nextDiscussionFollowSubscription(null), 'follow');
  assert.equal(nextDiscussionFollowSubscription('follow'), null);
  assert.equal(nextDiscussionFollowSubscription('ignore'), 'follow');
  assert.equal(discussionFollowStarPresentation(null).label, 'Follow discussion');
  assert.equal(discussionFollowStarPresentation('follow').label, 'Unfollow discussion');
  assert.equal(discussionFollowStarPresentation('ignore').followed, false);
  assert.equal(discussionFollowStarPresentation('ignore').icon, 'far fa-star');
  assert.match(starSrc, /discussion\.save\(\{ subscription: next \}\)/);
  assert.doesNotMatch(starSrc, /\/api\/subscriptions/);
  assert.doesNotMatch(starSrc, /localStorage/);
});

test('guests do not get a mutation star and phone hides the large menu only', () => {
  assert.equal(canMutateDiscussionFollow(null), false);
  assert.equal(canMutateDiscussionFollow(undefined), false);
  assert.equal(canMutateDiscussionFollow({ id: 1 }), true);
  assert.match(chromeSrc, /removeItem\(items, 'subscription'\)/);
  assert.match(chromeSrc, /removeItem\(items, 'controls'\)/);
  assert.match(chromeSrc, /isPhoneScreen\(\)/);
  assert.match(less, /@media \(max-width: 767px\)[\s\S]*\.DiscussionPage-nav \.item-subscription/);
  assert.match(less, /@media \(min-width: 768px\)[\s\S]*\.item-flatrateDiscussionFollow/);
});

test('ignore stays reachable in expanded discussion details and controls are canonical', () => {
  assert.match(secondarySrc, /Ignore discussion/);
  assert.match(secondarySrc, /discussion\.save\(\{ subscription: choice\.value \}\)/);
  assert.match(secondarySrc, /DiscussionControls\.controls/);
  assert.doesNotMatch(secondarySrc, /renameDiscussion/);
  assert.doesNotMatch(secondarySrc, /deleteDiscussion/);
});
