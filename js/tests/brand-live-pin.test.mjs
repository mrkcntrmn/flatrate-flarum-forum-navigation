#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { hrefForBoardKey } from '../src/forum/utils/boardRoutes.js';
import { flattenBrandBoards } from '../src/forum/utils/discussionBrandTitle.js';
import {
  activateBrandLive,
  addBrandLiveItem,
  prepareBrandLiveMount,
  removeBrandLiveItem,
  resolveBrandLiveTag,
  shouldShowBrandLive,
} from '../src/forum/utils/brandLivePin.js';

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

function productionRouteRecord() {
  const data = { routeName: 'tag' };
  const record = {
    type: 'tag',
    data,
    matches() {
      return true;
    },
    get(key) {
      return data[key];
    },
    set(key, value) {
      data[key] = value;
    },
  };
  assert.equal(typeof record.currentTag, 'undefined');
  assert.deepEqual(Object.keys(record).sort(), ['data', 'get', 'matches', 'set', 'type']);
  return record;
}

function itemList() {
  const items = { items: {} };
  items.add = (key, vnode, priority) => {
    items.items[key] = { vnode, priority };
  };
  items.remove = (key) => {
    delete items.items[key];
  };
  return items;
}

function countingProvider(availableKeys) {
  const calls = [];
  return {
    calls,
    available(boardKey) {
      return availableKeys.includes(boardKey);
    },
    activate(boardKey) {
      calls.push(boardKey);
    },
  };
}

test('production route record has no currentTag; IndexPage Ford still mounts and activates', () => {
  const route = productionRouteRecord();
  const rootCurrentTag =
    route && typeof route.currentTag === 'function' ? route.currentTag() : null;
  assert.equal(rootCurrentTag, null);

  const ford = tag('ford');
  const page = { currentTag: () => ford };
  const live = countingProvider(['ford', 'alfa-romeo', 'genesis']);
  const mount = prepareBrandLiveMount({
    page,
    currentTag: rootCurrentTag,
    searchParams: { tags: 'toyota' },
    stickyParams: {},
    store: { all: () => [tag('toyota')] },
    signedIn: true,
    routeName: route.get('routeName'),
    pageNumber: 1,
    manifest,
    provider: live,
  });

  assert.equal(mount.show, true);
  assert.equal(mount.board.boardKey, 'ford');
  assert.equal(mount.board.slug, 'ford');
  assert.equal(mount.tag, ford);

  const items = itemList();
  addBrandLiveItem(items, { board: mount.board });
  assert.equal(items.items.flatrateBrandLive.priority, 115);
  assert.equal(items.items.flatrateBrandLive.vnode.board.boardKey, 'ford');

  activateBrandLive(mount.board, live);
  assert.deepEqual(live.calls, ['ford']);

  const alfa = prepareBrandLiveMount({
    page: { currentTag: () => tag('alpha-romeo') },
    currentTag: null,
    signedIn: true,
    routeName: 'tag',
    manifest,
    provider: live,
  });
  const genesis = prepareBrandLiveMount({
    page: { currentTag: () => tag('genisis') },
    currentTag: null,
    signedIn: true,
    routeName: 'tag',
    manifest,
    provider: live,
  });
  assert.equal(alfa.board.boardKey, 'alfa-romeo');
  assert.equal(alfa.board.slug, 'alpha-romeo');
  assert.equal(genesis.board.boardKey, 'genesis');
  assert.equal(genesis.board.slug, 'genisis');
});

test('brand tag falls back to route params and app.store when the page method is absent', () => {
  const route = productionRouteRecord();
  const alfaTag = tag('alpha-romeo');
  const genesisTag = tag('genisis');
  const store = { all: () => [alfaTag, genesisTag, tag('ford')] };
  const live = countingProvider(['alfa-romeo', 'genesis']);

  const fromExisting = resolveBrandLiveTag({
    page: {},
    currentTag: alfaTag,
    searchParams: { tags: 'ford' },
    store,
  });
  assert.equal(fromExisting, alfaTag);

  const alfa = prepareBrandLiveMount({
    page: {},
    currentTag: typeof route.currentTag === 'function' ? route.currentTag() : null,
    searchParams: { tags: 'alpha-romeo' },
    stickyParams: {},
    store,
    signedIn: true,
    routeName: 'tag',
    manifest,
    provider: live,
  });
  assert.equal(alfa.show, true);
  assert.equal(alfa.tag, alfaTag);
  assert.equal(alfa.board.boardKey, 'alfa-romeo');
  assert.equal(alfa.board.slug, 'alpha-romeo');

  const genesis = resolveBrandLiveTag({
    page: null,
    currentTag: null,
    searchParams: {},
    stickyParams: { tags: 'genisis' },
    store,
  });
  assert.equal(genesis, genesisTag);
  const genesisMount = prepareBrandLiveMount({
    page: { currentTag: undefined },
    currentTag: null,
    stickyParams: { tags: 'genisis' },
    store,
    signedIn: true,
    routeName: 'tag',
    manifest,
    provider: live,
  });
  assert.equal(genesisMount.board.boardKey, 'genesis');

  const closed = prepareBrandLiveMount({
    page: {},
    currentTag: null,
    searchParams: {},
    stickyParams: {},
    store,
    signedIn: true,
    routeName: 'tag',
    manifest,
    provider: live,
  });
  assert.equal(closed.show, false);
  assert.equal(closed.board, null);
  assert.equal(closed.tag, null);
  const items = itemList();
  items.add('flatrateBrandLive', { stale: true }, 115);
  removeBrandLiveItem(items);
  assert.equal(items.items.flatrateBrandLive, undefined);
  activateBrandLive(closed.board, live);
  assert.deepEqual(live.calls, []);
});
