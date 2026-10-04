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
import { discussionOverflowItems } from '../src/forum/utils/discussionOverflowItems.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const starSrc = readFileSync(join(root, 'js/src/forum/components/DiscussionFollowStar.js'), 'utf8');
const chromeSrc = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const actionsSrc = readFileSync(join(root, 'js/src/forum/components/DiscussionHeroActionsMenu.js'), 'utf8');
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

test('guests do not get a mutation star and phone removes native header controls', () => {
  assert.equal(canMutateDiscussionFollow(null), false);
  assert.equal(canMutateDiscussionFollow(undefined), false);
  assert.equal(canMutateDiscussionFollow({ id: 1 }), true);
  assert.match(chromeSrc, /removeItem\(items, 'subscription'\)/);
  assert.match(chromeSrc, /removeItem\(items, 'controls'\)/);
  assert.match(chromeSrc, /isPhoneScreen\(\)/);
  assert.match(chromeSrc, /canMutateDiscussionFollow/);
  assert.match(less, /@media \(max-width: 767px\)[\s\S]*\.DiscussionPage-nav \.item-subscription/);
  assert.match(less, /@media \(max-width: 767px\)[\s\S]*\.DiscussionPage-nav \.item-controls/);
  assert.match(less, /@media \(min-width: 768px\)[\s\S]*\.item-flatrateDiscussionFollow/);
});

test('phone Follow star uses the mobile primary-control slot without a text button', () => {
  assert.match(starSrc, /Button Button--icon Button--flat App-primaryControl FlatRateDiscussionFollowStar/);
  assert.match(starSrc, /aria-label=\{presentation\.label\}/);
  assert.match(starSrc, /aria-pressed=\{presentation\.followed \? 'true' : 'false'\}/);
  assert.match(starSrc, /discussion\.save\(\{ subscription: next \}\)/);
  assert.doesNotMatch(starSrc, />\s*Follow\s*</);
  assert.doesNotMatch(starSrc, /Button--primary/);
  assert.match(less, /\.FlatRateDiscussionFollowStar\.App-primaryControl/);
  assert.match(less, /background: transparent !important/);
  assert.match(less, /@media \(min-width: 768px\)[\s\S]*\.item-flatrateDiscussionFollow[\s\S]*display: none !important/);
});

test('mobile hero no longer configures notifications and reuses canonical controls', () => {
  assert.match(actionsSrc, /DiscussionControls\.controls/);
  assert.match(actionsSrc, /Dropdown/);
  assert.match(actionsSrc, /fas fa-ellipsis-v/);
  assert.doesNotMatch(actionsSrc, /Discussion actions/);
  assert.doesNotMatch(actionsSrc, /FlatRateDiscussionActions-label/);
  assert.doesNotMatch(actionsSrc, /FlatRateDiscussionActions-list/);
  assert.doesNotMatch(actionsSrc, /renameDiscussion/);
  assert.doesNotMatch(actionsSrc, /deleteDiscussion/);
  assert.doesNotMatch(actionsSrc, /Notifications/);
  assert.doesNotMatch(actionsSrc, /Not following/);
  assert.doesNotMatch(actionsSrc, /Ignore discussion/);
  assert.doesNotMatch(actionsSrc, /SUBSCRIPTION_CHOICES/);
  assert.doesNotMatch(actionsSrc, /discussion\.save\(\{ subscription: choice\.value \}\)/);
  assert.doesNotMatch(chromeSrc, /SUBSCRIPTION_CHOICES/);
  assert.doesNotMatch(chromeSrc, /includeNotifications/);
  assert.doesNotMatch(chromeSrc, /FlatRateDiscussionNotifications/);
});

test('mobile hero overflow removes the canonical subscription control', () => {
  assert.match(actionsSrc, /DiscussionControls\.controls/);
  assert.match(actionsSrc, /\.remove\(['"]subscription['"]\)/);
  assert.match(actionsSrc, /discussionOverflowItems/);
  assert.match(actionsSrc, /Dropdown/);
  assert.match(actionsSrc, /fas fa-ellipsis-v/);
  assert.doesNotMatch(actionsSrc, /!== ['"]Follow['"]/);
  assert.doesNotMatch(actionsSrc, /renameDiscussion/);
  assert.doesNotMatch(actionsSrc, /deleteDiscussion/);

  const userSeparator = { itemName: 'userSeparator' };
  const rename = { itemName: 'rename' };
  const tags = { itemName: 'tags' };
  const moderationSeparator = { itemName: 'moderationSeparator' };
  const hide = { itemName: 'hide' };
  const destructiveSeparator = { itemName: 'destructiveSeparator' };

  assert.deepEqual(discussionOverflowItems([userSeparator]), []);
  assert.deepEqual(
    discussionOverflowItems([userSeparator, rename, tags, moderationSeparator, hide, destructiveSeparator]),
    [rename, tags, moderationSeparator, hide]
  );
});
