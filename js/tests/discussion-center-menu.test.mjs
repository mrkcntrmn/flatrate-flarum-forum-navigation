#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  resolveDiscussionBoardTarget,
  resolveDiscussionBrandBoard,
  resolveDiscussionBrandTitle,
} from '../src/forum/utils/discussionBrandTitle.js';
import { PICK_A_BRAND, resolvePresentationTitle } from '../src/forum/utils/presentationTitle.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const presentationNavSrc = readFileSync(join(root, 'js/src/forum/components/PresentationNav.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');
const extendPhp = readFileSync(join(root, 'extend.php'), 'utf8');

const manifest = {
  groups: [
    {
      id: 'community',
      label: 'Push to Start',
      mode: 'link',
      destination: { type: 'tag', boardKey: 'start-here', slug: 'start-here' },
    },
    {
      id: 'technician-topics',
      label: 'Technician Topics',
      mode: 'link',
      destination: { type: 'tag', boardKey: 'general-shop-discussion', slug: 'general-shop-discussion' },
    },
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

function tag(slug, { name = slug, primary = null, position = undefined, child = false } = {}) {
  return {
    slug: () => slug,
    name: () => name,
    ...(primary === null ? {} : { isPrimary: () => primary }),
    ...(position === undefined ? {} : { position: () => position }),
    isChild: () => child,
  };
}

function discussion(...tags) {
  return {
    tags: () =>
      tags.map((entry) => (typeof entry === 'string' ? tag(entry) : entry)),
  };
}

test('generic center-menu label is FlatRate.wiki', () => {
  assert.equal(PICK_A_BRAND, 'FlatRate.wiki');
});

test('discussion center title resolves the current brand board', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('gm'), manifest }), 'GM');
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('ford'), manifest }), 'Ford');
});

test('discussion center title prefers a child marque when parent and child are attached', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('gm', 'chevrolet'), manifest }), 'Chevrolet');
});

test('discussion Brand resolver returns the deepest matching board', () => {
  assert.equal(resolveDiscussionBrandBoard({ discussion: discussion('gm'), manifest })?.slug, 'gm');
  assert.equal(resolveDiscussionBrandBoard({ discussion: discussion('gm', 'chevrolet'), manifest })?.slug, 'chevrolet');
  assert.equal(resolveDiscussionBrandBoard({ discussion: discussion('general-shop-discussion'), manifest }), null);
});

test('owning-board resolver covers Brand and non-Brand manifest boards', () => {
  assert.deepEqual(resolveDiscussionBoardTarget({ discussion: discussion('gm', 'chevrolet'), manifest }), {
    slug: 'chevrolet',
    name: 'Chevrolet',
    kind: 'brand',
  });
  assert.deepEqual(resolveDiscussionBoardTarget({ discussion: discussion('general-shop-discussion'), manifest }), {
    slug: 'general-shop-discussion',
    name: 'Technician Topics',
    kind: 'manifest',
  });
  assert.deepEqual(resolveDiscussionBoardTarget({ discussion: discussion('start-here'), manifest }), {
    slug: 'start-here',
    name: 'Push to Start',
    kind: 'manifest',
  });
});

test('unknown non-Brand primary board is used while secondary metadata is ignored', () => {
  const laborLaw = tag('labor-law-texas', { name: 'Texas Labor Law', primary: true });
  const breakdown = tag('job-breakdown', { name: 'Job Breakdown', primary: false });

  assert.deepEqual(resolveDiscussionBoardTarget({ discussion: discussion(breakdown, laborLaw), manifest }), {
    slug: 'labor-law-texas',
    name: 'Texas Labor Law',
    kind: 'primary-tag',
  });
  assert.equal(resolveDiscussionBoardTarget({ discussion: discussion(breakdown), manifest }), null);
});

test('position metadata is accepted as the Flarum 1.x primary-tag fallback', () => {
  const primary = tag('diagnostics', { name: 'Diagnostics', position: 3 });
  const secondary = tag('job-breakdown', { name: 'Job Breakdown', position: null });
  assert.deepEqual(resolveDiscussionBoardTarget({ discussion: discussion(secondary, primary), manifest }), {
    slug: 'diagnostics',
    name: 'Diagnostics',
    kind: 'primary-tag',
  });
});

test('non-brand discussions still use FlatRate.wiki as the center title', () => {
  assert.equal(resolveDiscussionBrandTitle({ discussion: discussion('general-shop-discussion'), manifest }), PICK_A_BRAND);
});

test('GM board index retains the FlatRate.wiki title contract', () => {
  assert.equal(resolvePresentationTitle({ currentTag: tag('gm') }), PICK_A_BRAND);
});

test('DiscussionPage center popup is HOME + Brand presentation without START or Following', () => {
  assert.match(discussionSrc, /DiscussionPage\.prototype, 'sidebarItems'/);
  assert.match(discussionSrc, /flatrateDiscussionBrandPicker/);
  assert.match(discussionSrc, /resolveDiscussionBrandTitle/);
  assert.match(discussionSrc, /pickerItems\.add\(\s*'allDiscussions'/);
  assert.match(discussionSrc, /icon="fas fa-warehouse"/);
  assert.match(discussionSrc, />\s*HOME\s*<\/LinkButton>/);
  assert.match(discussionSrc, /listDiscussionBrandBoards\(manifest\)/);
  assert.match(discussionSrc, /FlatRateDiscussionBrandLink/);
  assert.match(discussionSrc, /FlatRateDiscussionPicker-home/);
  assert.doesNotMatch(
    discussionSrc,
    /pickerItems\.add\(\s*'flatratePresentationNav',\s*<PresentationNav/
  );
  assert.doesNotMatch(discussionSrc, /following/i);
  assert.match(presentationNavSrc, /start && this\.attrs\.hideStart === true/);
  assert.match(discussionSrc, /className="App-titleControl FlatRateDiscussionBrandPicker"/);
});

test('discussion back arrow overrides the Flarum 1.8.19 live back-button seam', () => {
  assert.match(
    discussionSrc,
    /override\(\s*Navigation\.prototype,\s*'getBackButton'/
  );

  assert.match(discussionSrc, /currentDiscussionBoardTarget\(\)/);
  assert.match(discussionSrc, /href=\{tagHref\(target\.slug\)\}/);
  assert.match(discussionSrc, /FlatRateDiscussionBackToBoard/);
  assert.match(discussionSrc, /aria-label=\{`Back to \$\{target\.name\}`\}\s*\n\s*force/);

  assert.doesNotMatch(
    discussionSrc,
    /extend\(\s*Navigation\.prototype,\s*'items'/
  );
  assert.doesNotMatch(discussionSrc, /history\.back/);
  assert.doesNotMatch(discussionSrc, /history\.backUrl/);
  assert.doesNotMatch(discussionSrc, /m\.route\.set/);
  assert.doesNotMatch(discussionSrc, /window\.history/);
});

test('discussion direct entry overrides the no-history drawer branch', () => {
  assert.match(
    discussionSrc,
    /override\(\s*Navigation\.prototype,\s*'getDrawerButton'/
  );

  assert.match(discussionSrc, /discussionBoardBackButton\(target\)/);
});

test('phone swaps the scrubber for the brand picker while desktop keeps scrubber behavior', () => {
  assert.match(less, /@media \(max-width: 767px\)/);
  assert.match(less, /\.DiscussionPage-nav \.item-scrubber/);
  assert.match(less, /display: none !important/);
  assert.match(less, /\.DiscussionPage-nav \.item-flatrateDiscussionBrandPicker/);
  assert.match(less, /@media \(min-width: 768px\)/);
  assert.match(less, /\.FlatRateDiscussionBrandPicker \.Dropdown-menu\s+\.FlatRateDiscussionPicker-link/);
  assert.match(less, /\.FlatRateDiscussionBrandLink\.depth-1/);
  assert.match(extendPhp, /discussion-center-menu\.less/);
});
