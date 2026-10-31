#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  normalizePinnedIds,
  orderDiscussionsByConfiguredIds,
  isCleanRootIndex,
  mainPinIdsFromForum,
} from '../src/forum/utils/mainLandingPins.js';
import {
  recordOpenBoardAtTopIntent,
  consumeOpenBoardAtTopIntent,
  OPEN_BOARD_AT_TOP_KEY,
} from '../src/forum/utils/boardBackIntent.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const pinsSrc = readFileSync(join(root, 'js/src/forum/components/MainLandingPins.js'), 'utf8');
const adminSrc = readFileSync(join(root, 'js/src/admin/components/MainLandingPinnedDiscussions.js'), 'utf8');
const extendPhp = readFileSync(join(root, 'extend.php'), 'utf8');

test('pin ID normalization fails closed and preserves first-seen order', () => {
  assert.deepEqual(normalizePinnedIds([89, 42, 103, 89, 0, 'x']), [89, 42, 103]);
  assert.deepEqual(normalizePinnedIds('[1,2,2]'), [1, 2]);
  assert.deepEqual(normalizePinnedIds('{bad'), []);
});

test('client restores configured order among returned models', () => {
  const discussions = [
    { id: () => '42' },
    { id: () => '89' },
    { id: () => '103' },
  ];
  assert.deepEqual(
    orderDiscussionsByConfiguredIds(discussions, [89, 42, 103]).map((d) => d.id()),
    ['89', '42', '103']
  );
});

test('forum attributes expose independent public and member pin lists', () => {
  const forum = {
    attribute(name) {
      if (name === 'flatratePublicMainPinnedDiscussionIds') return [1, 2];
      if (name === 'flatrateMemberMainPinnedDiscussionIds') return [9, 1];
      return null;
    },
  };
  assert.deepEqual(mainPinIdsFromForum(forum, 'public'), [1, 2]);
  assert.deepEqual(mainPinIdsFromForum(forum, 'member'), [9, 1]);
});

test('clean root detection excludes search, following, tags, and page 2+', () => {
  assert.equal(isCleanRootIndex({ pathname: '/', page: 1 }), true);
  assert.equal(isCleanRootIndex({ pathname: '/', page: 2 }), false);
  assert.equal(isCleanRootIndex({ pathname: '/', searchParams: { q: 'x' } }), false);
  assert.equal(isCleanRootIndex({ pathname: '/', routeName: 'following' }), false);
  assert.equal(isCleanRootIndex({ pathname: '/', currentTag: { slug: () => 'bmw' } }), false);
});

test('source wires dual-audience MAIN pins without native sticky mutation', () => {
  assert.match(indexSrc, /MainLandingPins/);
  assert.match(indexSrc, /audience="public"/);
  assert.match(indexSrc, /audience="member"/);
  assert.match(indexSrc, /flatrateExcludeMainPins/);
  assert.match(pinsSrc, /flatrateMainPins/);
  assert.match(extendPhp, /MainPinsFilter/);
  assert.match(extendPhp, /ExcludeMainPinsFilter/);
  assert.match(extendPhp, /admin\.js/);
  assert.match(extendPhp, /TagCanonical::class/);
  assert.match(adminSrc, /SETTING_PUBLIC/);
  assert.match(adminSrc, /SETTING_MEMBER/);
  assert.doesNotMatch(indexSrc, /is_sticky/);
  assert.doesNotMatch(pinsSrc, /is_sticky/);
  assert.doesNotMatch(adminSrc, /isSticky/);
});

test('board-back records one-shot open-at-top intent without disabling native Back', () => {
  assert.match(discussionSrc, /recordOpenBoardAtTopIntent/);
  assert.match(discussionSrc, /consumeOpenBoardAtTopIntent/);
  assert.match(discussionSrc, /flatrateOpenBoardAtTop/);
  assert.match(discussionSrc, /lastDiscussion = undefined/);

  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      setItem: (k, v) => store.set(k, v),
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      removeItem: (k) => store.delete(k),
    },
  };

  recordOpenBoardAtTopIntent();
  assert.equal(store.get(OPEN_BOARD_AT_TOP_KEY), '1');
  assert.equal(consumeOpenBoardAtTopIntent(), true);
  assert.equal(consumeOpenBoardAtTopIntent(), false);
});


test('member root loading discards the unfiltered server preload before requesting the paginated feed', () => {
  const start = indexSrc.indexOf("    override(app.discussions, 'loadPage'");
  const hook = indexSrc.slice(start, indexSrc.indexOf('\n    });', start) + 8);
  let preloadConsumed = 0;
  let loaded = 0;
  const app = {
    preloadedApiDocument: () => { preloadConsumed++; },
    discussions: { requestParams: () => ({ filter: { flatrateExcludeMainPins: 'member' } }), loadPage: () => { loaded++; return 'page'; } },
  };
  const override = (target, method, extension) => {
    const original = target[method].bind(target);
    target[method] = (...args) => extension.call(target, original, ...args);
  };
  new Function('app', 'override', hook)(app, override);
  assert.equal(app.discussions.loadPage(1), 'page');
  assert.equal(preloadConsumed, 1);
  app.discussions.requestParams = () => ({ filter: {} });
  app.discussions.loadPage(1);
  assert.equal(preloadConsumed, 1, 'tag/search/ordinary requests keep the native preload');
  assert.equal(loaded, 2);
});
