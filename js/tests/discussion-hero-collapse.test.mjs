#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const chromeSrc = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const actionsSrc = readFileSync(join(root, 'js/src/forum/components/DiscussionHeroActionsMenu.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');

test('phone discussion hero starts collapsed without localStorage', () => {
  assert.match(chromeSrc, /export function discussionHeroStartsCollapsed\(\) \{\s*return true;\s*\}/);
  assert.match(chromeSrc, /this\.flatrateHeroExpanded = false/);
  assert.doesNotMatch(chromeSrc, /localStorage/);
  assert.match(chromeSrc, /extend\(DiscussionHero\.prototype, 'items'/);
  assert.doesNotMatch(chromeSrc, /DiscussionHero\.prototype\.items =/);
});

test('collapsed hero is title plus disclosure only', () => {
  const collapsed = less.match(
    /\.FlatRateDiscussionHero--collapsed \.DiscussionHero-items > li:not\(\.item-title\):not\(\.item-flatrateHeroToggle\)\s*\{[^}]*display: none !important;[^}]*\}/
  );
  assert.ok(collapsed, 'collapsed hero must hide every item except title and toggle');
  assert.doesNotMatch(collapsed[0], /item-tags/);
  assert.doesNotMatch(collapsed[0], /:not\(\.item-tags\)/);
  assert.match(chromeSrc, /aria-expanded/);
  assert.match(chromeSrc, /aria-controls/);
  assert.match(chromeSrc, /FlatRateDiscussionHero-details/);
  assert.match(chromeSrc, /DiscussionHeroActionsMenu/);
  assert.match(chromeSrc, /onclick=\{\(event\) =>/);
  assert.doesNotMatch(chromeSrc, /localStorage/);
});

test('title and disclosure each own a centered full-width row', () => {
  assert.match(less, /\.DiscussionHero \.item-title\s*\{[^}]*order: 1;[^}]*flex: 0 0 100%;[^}]*width: 100%;[^}]*text-align: center;/s);
  assert.match(less, /\.DiscussionHero \.DiscussionHero-title\s*\{[^}]*width: 100%;[^}]*margin-left: auto;[^}]*margin-right: auto;[^}]*text-align: center;/s);
  assert.match(less, /\.DiscussionHero \.item-flatrateHeroToggle\s*\{[^}]*order: 2;[^}]*flex: 0 0 100%;[^}]*width: 100%;[^}]*display: flex;[^}]*justify-content: center;/s);
  assert.match(less, /\.DiscussionHero \.FlatRateDiscussionHero-toggle\s*\{[^}]*margin-left: auto;[^}]*margin-right: auto;[^}]*min-width: 44px;[^}]*min-height: 44px;/s);
  assert.match(less, /\.FlatRateDiscussionHero-toggle:focus-visible/);
});

test('expanded hero uses one canonical overflow trigger', () => {
  assert.match(actionsSrc, /DiscussionControls\.controls/);
  assert.match(actionsSrc, /icon="fas fa-ellipsis-v"/);
  assert.match(actionsSrc, /<Dropdown/);
  assert.match(less, /\.DiscussionHero \.item-flatrateHeroSecondary\s*\{[^}]*order: 4;[^}]*justify-content: flex-end;/s);
  assert.doesNotMatch(actionsSrc, /FlatRateDiscussionActions-list/);
  assert.doesNotMatch(less, /FlatRateDiscussionActions-list/);
  assert.doesNotMatch(less, /FlatRateDiscussionNotifications/);
});
