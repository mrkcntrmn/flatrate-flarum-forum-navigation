#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolveDiscussionBrandTitle } from '../src/forum/utils/discussionBrandTitle.js';
import { PICK_A_BRAND, resolvePresentationTitle } from '../src/forum/utils/presentationTitle.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');
const extendPhp = readFileSync(join(root, 'extend.php'), 'utf8');

const manifest = {
  groups: [
    {
      id: 'brands',
      mode: 'tree',
      boards: [
        {
          boardKey: 'gm',
          name: 'GM',
          slug: 'gm',
          children: [
            { boardKey: 'chevrolet', name: 'Chevrolet', slug: 'chevrolet', children: [] },
          ],
        },
        { boardKey: 'ford', name: 'Ford', slug: 'ford', children: [] },
      ],
    },
  ],
};

function tag(slug) {
  return { slug: () => slug };
}

function discussion(...slugs) {
  return { tags: () => slugs.map(tag) };
}

test('discussion center title resolves the current brand board', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('gm'), manifest }), 'GM');
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('ford'), manifest }), 'Ford');
});

test('discussion center title prefers a child marque when parent and child are attached', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('gm', 'chevrolet'), manifest }), 'Chevrolet');
});

test('non-brand discussions fall back to Pick a Brand', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('general-shop-discussion'), manifest }), PICK_A_BRAND);
});

test('GM board index retains the Pick a Brand title contract', () => {
  assert.equal(resolvePresentationTitle({ currentTag: tag('gm') }), PICK_A_BRAND);
});

test('DiscussionPage mounts a HOME + PresentationNav center picker', () => {
  assert.match(discussionSrc, /DiscussionPage\.prototype, 'sidebarItems'/);
  assert.match(discussionSrc, /flatrateDiscussionBrandPicker/);
  assert.match(discussionSrc, /resolveDiscussionBrandTitle/);
  assert.match(discussionSrc, /item[s]?\.add\(\s*'allDiscussions'/);
  assert.match(discussionSrc, /<PresentationNav manifest=\{manifest\}/);
  assert.match(discussionSrc, /className="App-titleControl FlatRateDiscussionBrandPicker"/);
});

test('phone swaps the scrubber for the brand picker while desktop keeps scrubber behavior', () => {
  assert.match(less, /@media \(max-width: 767px\)/);
  assert.match(less, /\.DiscussionPage-nav \.item-scrubber/);
  assert.match(less, /display: none !important/);
  assert.match(less, /\.DiscussionPage-nav \.item-flatrateDiscussionBrandPicker/);
  assert.match(less, /@media \(min-width: 768px\)/);
  assert.match(extendPhp, /discussion-center-menu\.less/);
});
