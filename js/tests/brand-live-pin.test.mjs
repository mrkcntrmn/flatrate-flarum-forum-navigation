#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { hrefForBoardKey } from '../src/forum/utils/boardRoutes.js';
import { flattenBrandBoards } from '../src/forum/utils/discussionBrandTitle.js';
import { shouldShowBrandLive } from '../src/forum/utils/brandLivePin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));

function tag(slug) {
  return { slug: () => slug };
}

function provider(available = true) {
  return { available: () => available };
}

test('45 brand boards map room identity from boardKey, including legacy slugs', () => {
  const boards = flattenBrandBoards(manifest).map(({ board }) => board);
  assert.equal(boards.length, 45);
  const keys = boards.map((board) => board.boardKey);
  assert.equal(new Set(keys).size, 45);

  const alfa = boards.find((board) => board.boardKey === 'alfa-romeo');
  const genesis = boards.find((board) => board.boardKey === 'genesis');
  assert.equal(alfa.slug, 'alpha-romeo');
  assert.equal(genesis.slug, 'genisis');
  assert.equal(hrefForBoardKey('alfa-romeo', { manifest }), '/t/alpha-romeo');
  assert.equal(hrefForBoardKey('genesis', { manifest }), '/t/genisis');
  assert.equal(hrefForBoardKey('ford', { manifest }), '/t/ford');
  assert.equal(hrefForBoardKey('toyota', { manifest }), '/t/toyota');
  assert.equal(hrefForBoardKey('gm', { manifest }), '/t/gm');
  assert.equal(hrefForBoardKey('cdjr', { manifest }), '/t/cdjr');
  assert.equal(hrefForBoardKey('jlr', { manifest }), '/t/jlr');
  assert.equal(hrefForBoardKey('chevrolet', { manifest }), '/t/chevrolet');
  assert.equal(hrefForBoardKey('jeep', { manifest }), '/t/jeep');
  assert.equal(hrefForBoardKey('range-rover', { manifest }), '/t/range-rover');
  assert.equal(hrefForBoardKey('other-makes', { manifest }), '/t/other-makes');
  assert.equal(hrefForBoardKey('acura', { manifest }), '/t/acura');
  assert.equal(hrefForBoardKey('not-a-brand', { manifest }), null);

  for (const board of boards) {
    assert.equal(`${board.boardKey}-live`.endsWith('-live'), true);
    assert.match(board.boardKey, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});

test('brand pin is page-1 canonical boards only when the provider is available', () => {
  const base = {
    signedIn: true,
    routeName: 'tag',
    currentTag: tag('alpha-romeo'),
    page: 1,
    manifest,
    provider: provider(true),
  };
  assert.equal(shouldShowBrandLive(base), true);
  assert.equal(shouldShowBrandLive({ ...base, currentTag: tag('genisis') }), true);
  assert.equal(shouldShowBrandLive({ ...base, provider: provider(false) }), false);
  assert.equal(shouldShowBrandLive({ ...base, signedIn: false }), false);
  assert.equal(shouldShowBrandLive({ ...base, page: 2 }), false);
  assert.equal(shouldShowBrandLive({ ...base, routeName: 'following' }), false);
  assert.equal(shouldShowBrandLive({ ...base, searchParams: { q: 'brakes' } }), false);
  assert.equal(shouldShowBrandLive({ ...base, currentTag: tag('general-shop-discussion') }), false);
  assert.equal(shouldShowBrandLive({ ...base, currentTag: null }), false);
});
