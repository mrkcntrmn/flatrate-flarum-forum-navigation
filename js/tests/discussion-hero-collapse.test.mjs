#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const chromeSrc = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');

test('phone discussion hero starts collapsed without localStorage', () => {
  assert.match(chromeSrc, /export function discussionHeroStartsCollapsed\(\) \{\s*return true;\s*\}/);
  assert.match(chromeSrc, /this\.flatrateHeroExpanded = false/);
  assert.doesNotMatch(chromeSrc, /localStorage/);
  assert.match(chromeSrc, /extend\(DiscussionHero\.prototype, 'items'/);
  assert.doesNotMatch(chromeSrc, /DiscussionHero\.prototype\.items =/);
});

test('collapsed hero hides secondary items and expansion restores the same list', () => {
  assert.match(less, /\.FlatRateDiscussionHero--collapsed \.DiscussionHero-items > li:not\(\.item-title\):not\(\.item-flatrateHeroToggle\)/);
  assert.match(less, /display: none !important/);
  assert.match(chromeSrc, /aria-expanded/);
  assert.match(chromeSrc, /aria-controls/);
  assert.match(chromeSrc, /FlatRateDiscussionHero-details/);
  assert.match(chromeSrc, /DiscussionHeroSecondaryActions/);
});
