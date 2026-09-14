#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolvePresentationTitle, PICK_A_BRAND } from '../src/forum/utils/presentationTitle.js';
import { isNativeTagItemKey, stripNativeTagPresentation } from '../src/forum/utils/stripNativeTagPresentation.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

function tag(slug, name) {
  return { slug: () => slug, name: () => name };
}

function fakeItemList(keys) {
  const items = Object.fromEntries(keys.map((key) => [key, { content: key, priority: 0 }]));
  return {
    items,
    remove(key) {
      delete this.items[key];
    },
    keys() {
      return Object.keys(this.items);
    },
  };
}

test('IndexPage.navItems remains the Flarum Tags 1.8.19 seam', () => {
  assert.match(indexSrc, /extend\(IndexPage\.prototype, 'navItems'/);
  assert.match(indexSrc, /addTagList\.js/);
  assert.match(indexSrc, /-50/);
  assert.doesNotMatch(indexSrc, /after: 'flarum-tags'/);
  assert.doesNotMatch(indexSrc, /from 'flarum\/forum\/components\/IndexSidebar'/);
});

test('phone hamburger drawer mounts presentation nav via HeaderSecondary', () => {
  assert.match(indexSrc, /from 'flarum\/forum\/components\/HeaderSecondary'/);
  assert.match(indexSrc, /extend\(HeaderSecondary\.prototype, 'items'/);
  assert.match(indexSrc, /flatrateDrawerNav/);
  assert.match(indexSrc, /hideDrawerAfterLinkClick/);
  assert.match(indexSrc, /app\.drawer\.hide/);
  // Drawer session/avatar order is CSS-only so the desktop header pin stays.
  assert.doesNotMatch(indexSrc, /items\.(add|remove)\(\s*['\"]session['\"]/);
});

test('SelectDropdown override is annotation-scoped', () => {
  assert.match(indexSrc, /flatratePresentationTitle !== true/);
  assert.match(indexSrc, /override\(SelectDropdown\.prototype, 'getButtonContent'/);
  assert.doesNotMatch(indexSrc, /extend\(SelectDropdown\.prototype, 'getButtonContent'/);
  assert.match(indexSrc, /extend\(IndexPage\.prototype, 'sidebarItems'/);
  assert.match(indexSrc, /TECHNICIAN_TOPICS_ICON/);
  assert.match(indexSrc, /fa-wrench/);
});

test('title matrix uses tag data and explicit aliases', () => {
  assert.equal(resolvePresentationTitle({ routeName: 'index' }), PICK_A_BRAND);
  assert.equal(resolvePresentationTitle({ routeName: 'index', searchContext: { sort: 'newest' } }), PICK_A_BRAND);
  assert.equal(resolvePresentationTitle({ currentTag: tag('nissan', 'Nissan') }), 'Nissan');
  assert.equal(resolvePresentationTitle({ currentTag: tag('gm', 'GM') }), 'GM');
  assert.equal(resolvePresentationTitle({ currentTag: tag('chevrolet', 'Chevrolet') }), 'Chevrolet');
  assert.equal(resolvePresentationTitle({ currentTag: tag('cdjr', 'CDJR') }), 'CDJR');
  assert.equal(resolvePresentationTitle({ currentTag: tag('jeep', 'Jeep') }), 'Jeep');
  assert.equal(
    resolvePresentationTitle({ currentTag: tag('general-shop-discussion', 'General Shop Discussion') }),
    'Technician Topics'
  );
  assert.equal(resolvePresentationTitle({ currentTag: tag('start-here', 'Start Here') }), 'START');
  assert.equal(resolvePresentationTitle({ currentTag: tag('start-here', 'Push to Start') }), 'START');
  assert.equal(resolvePresentationTitle({ currentTag: tag('start-here', 'START') }), 'START');
  assert.equal(resolvePresentationTitle({ routeName: 'community', manifest: {} }), null);
});

test('Following and unknown/search contexts fall back to core', () => {
  assert.equal(resolvePresentationTitle({ routeName: 'following' }), null);
  assert.equal(resolvePresentationTitle({ activeCoreContext: 'following', routeName: 'index' }), null);
  assert.equal(resolvePresentationTitle({ routeName: 'index', searchContext: { onFollowing: true } }), null);
  assert.equal(
    resolvePresentationTitle({ routeName: 'index', searchContext: { tags: 'general-shop-discussion' } }),
    'Technician Topics'
  );
  assert.equal(resolvePresentationTitle({ routeName: 'index', searchContext: { q: 'torque' } }), null);
  assert.equal(resolvePresentationTitle({ routeName: 'user', routeContext: { username: 'tech' } }), null);
});

test('native Tags presentation keys are removed; core items stay', () => {
  assert.equal(isNativeTagItemKey('tags'), true);
  assert.equal(isNativeTagItemKey('moreTags'), true);
  assert.equal(isNativeTagItemKey('tag12'), true);
  assert.equal(isNativeTagItemKey('allDiscussions'), false);
  assert.equal(isNativeTagItemKey('following'), false);
  assert.equal(isNativeTagItemKey('flatratePresentationNav'), false);
  assert.equal(isNativeTagItemKey('separator'), false);

  const items = fakeItemList([
    'allDiscussions',
    'following',
    'tags',
    'separator',
    'tag1',
    'tag2',
    'moreTags',
    'flatratePresentationNav',
  ]);
  stripNativeTagPresentation(items);
  assert.deepEqual(items.keys().sort(), ['allDiscussions', 'flatratePresentationNav', 'following']);
});

test('unrelated separator is kept when Tags presentation is absent', () => {
  const items = fakeItemList(['allDiscussions', 'separator', 'following']);
  stripNativeTagPresentation(items);
  assert.deepEqual(items.keys().sort(), ['allDiscussions', 'following', 'separator']);
});
