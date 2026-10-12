#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  DISCUSSION_ACTIVITY_VISIBLE_MS,
  showDiscussionActivityTime,
} from '../src/forum/utils/discussionActivityTime.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const code = readFileSync(join(root, 'js/src/forum/compactDiscussionActivity.js'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const pins = readFileSync(join(root, 'js/src/forum/components/MainLandingPins.js'), 'utf8');

test('activity timestamp is visible strictly less than 24 hours after posting', () => {
  const now = Date.parse('2026-10-12T16:44:56Z');
  assert.equal(DISCUSSION_ACTIVITY_VISIBLE_MS, 86_400_000);
  assert.equal(showDiscussionActivityTime(new Date(now), now), true);
  assert.equal(showDiscussionActivityTime(new Date(now - 1), now), true);
  assert.equal(showDiscussionActivityTime(new Date(now - 23 * 60 * 60 * 1000), now), true);
  assert.equal(showDiscussionActivityTime(new Date(now - 86_399_999), now), true);
  assert.equal(showDiscussionActivityTime(new Date(now - 86_400_000), now), false);
  assert.equal(showDiscussionActivityTime(new Date(now - 86_400_001), now), false);
  assert.equal(showDiscussionActivityTime(new Date(now - 3 * 86_400_000), now), false);
});

test('missing, malformed, and future activity timestamps are not shown', () => {
  const now = Date.parse('2026-10-12T16:44:56Z');
  for (const invalid of [null, undefined, '', 'not-a-timestamp', new Date(NaN)]) {
    assert.equal(showDiscussionActivityTime(invalid, now), false);
  }
  assert.equal(showDiscussionActivityTime(new Date(now + 1), now), false);
  assert.equal(showDiscussionActivityTime(new Date(now - 10), NaN), false);
});

test('native TerminalPost is bounded to a list-row display override', () => {
  assert.match(index, /import registerCompactDiscussionActivity from '\.\/compactDiscussionActivity';/);
  assert.match(index, /registerCompactDiscussionActivity\(\);/);
  assert.match(code, /override\(TerminalPost\.prototype, 'view'/);
  assert.match(code, /const lastPost = Boolean\(this\.attrs\.lastPost && discussion\.replyCount\(\)\)/);
  assert.match(code, /lastPost \? 'lastPostedAt' : 'createdAt'/);
  assert.match(code, /lastPost \? 'lastPostedUser' : 'user'/);
  assert.match(code, /icon\('fas fa-reply'\)/);
  assert.match(code, /username\(user\)/);
  assert.match(code, /lastPost && recent \? \[' ', humanTime\(time\)\] : null/);
  assert.doesNotMatch(code, /'core\.forum\.discussion_list\.replied_text'/);
  assert.match(code, /if \(!lastPost && recent\) return original\(\);/);
  assert.doesNotMatch(code, /localStorage|save\(|delete\(/);
});

test('MAIN curated pins use the same native discussion-list item', () => {
  assert.match(pins, /import DiscussionListItem from 'flarum\/forum\/components\/DiscussionListItem'/);
  assert.match(pins, /<DiscussionListItem discussion=\{discussion\} params=\{params\}/);
});
