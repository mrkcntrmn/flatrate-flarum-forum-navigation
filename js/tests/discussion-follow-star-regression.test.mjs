#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const chrome = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const star = readFileSync(join(root, 'js/src/forum/components/DiscussionFollowStar.js'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

test('discussion Follow star remains the discussion primary control', () => {
  assert.match(chrome, /flatrateDiscussionFollow/);
  assert.match(chrome, /DiscussionFollowStar/);
  assert.match(star, /App-primaryControl FlatRateDiscussionFollowStar/);
  assert.doesNotMatch(chrome, /FlatRateMainNotifications/);
  assert.doesNotMatch(star, /FlatRateMainNotifications/);
  assert.match(index, /shouldShowMainNotifications/);
  assert.doesNotMatch(index, /DiscussionPage\.prototype, 'sidebarItems'/);
});
