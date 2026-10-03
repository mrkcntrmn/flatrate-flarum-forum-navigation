#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolveIndexBoardSlug } from '../src/forum/utils/currentBoardContext.js';
import { resolveBoardStructuralBack } from '../src/forum/utils/boardStructuralBack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const mainBack = { href: '/', accessibleLabel: 'Back to MAIN' };

test('runtime board slug reads app.currentTag and the route param', () => {
  assert.match(discussionSrc, /app\.currentTag/);
  assert.match(discussionSrc, /m\.route\.param\('tags'\)/);
  assert.match(discussionSrc, /stickyParams/);
  assert.doesNotMatch(discussionSrc, /current\.currentTag/);
  assert.match(discussionSrc, /resolveIndexBoardSlug/);
});

test('index boards resolve a structural MAIN target from the live tag seam', () => {
  for (const slug of ['volkswagen', 'cdjr', 'general-shop-discussion', 'jeep', 'gm', 'jlr']) {
    const resolved = resolveIndexBoardSlug({
      isIndexPage: true,
      currentTag: { slug: () => slug },
    });
    assert.equal(resolved, slug);
    assert.deepEqual(resolveBoardStructuralBack({ slug: resolved, manifest }), mainBack);
  }
});

test('route param and sticky tags are fallbacks, and MAIN stays closed', () => {
  assert.equal(
    resolveIndexBoardSlug({ isIndexPage: true, routeTagParam: 'volkswagen' }),
    'volkswagen'
  );
  assert.equal(
    resolveIndexBoardSlug({ isIndexPage: true, stickyTags: 'cdjr' }),
    'cdjr'
  );
  assert.equal(
    resolveIndexBoardSlug({
      isIndexPage: true,
      currentTag: { slug: () => 'jeep' },
      routeTagParam: 'volkswagen',
      stickyTags: 'cdjr',
    }),
    'jeep'
  );
  assert.equal(resolveIndexBoardSlug({ isIndexPage: true }), '');
  assert.equal(resolveIndexBoardSlug({ isIndexPage: false, routeTagParam: 'volkswagen' }), '');
  assert.equal(
    resolveIndexBoardSlug({ isIndexPage: true, isDiscussionPage: true, currentTag: { slug: () => 'jeep' } }),
    ''
  );
  assert.equal(resolveBoardStructuralBack({ slug: '' }), null);
});
