#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  MAIN_LIVE_CHAT_ITEM,
  MAIN_LIVE_CHAT_PRIORITY,
  CANONICAL_MAIN_LIVE_HREF,
  addMainLiveChatItem,
  removeMainLiveChatItem,
  shouldShowMainLiveChat,
  isLiveMainProviderAvailable,
  resolveMainLiveHref,
  formatLiveCountPresentation,
  getLiveMainProvider,
} from '../src/forum/utils/mainLiveChat.js';
import {
  START_BOARD_PIN_ITEM,
  START_BOARD_PIN_PRIORITY,
  addStartBoardPinItem,
} from '../src/forum/utils/startBoardPin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pinSrc = readFileSync(join(root, 'js/src/forum/components/MainLiveChatPin.js'), 'utf8');
const utilSrc = readFileSync(join(root, 'js/src/forum/utils/mainLiveChat.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

function fakeItemList() {
  const items = {};
  return {
    items,
    add(key, content, priority = 0) {
      items[key] = { content, priority };
    },
    remove(key) {
      delete items[key];
    },
  };
}

function availableProvider(overrides = {}) {
  return {
    available: () => true,
    liveCount: () => 3,
    userLive: () => false,
    setUserLive: async () => true,
    href: () => CANONICAL_MAIN_LIVE_HREF,
    ...overrides,
  };
}

test('provider unavailable or throwing => row absent', () => {
  assert.equal(isLiveMainProviderAvailable(null), false);
  assert.equal(isLiveMainProviderAvailable({}), false);
  assert.equal(isLiveMainProviderAvailable({ available: () => false }), false);
  assert.equal(
    isLiveMainProviderAvailable({
      available() {
        throw new Error('boom');
      },
    }),
    false
  );
  assert.equal(
    shouldShowMainLiveChat({
      signedIn: true,
      pathname: '/',
      page: 1,
      provider: null,
    }),
    false
  );
});

test('provider available on clean signed-in root page 1 => visible', () => {
  const provider = availableProvider();
  assert.equal(
    shouldShowMainLiveChat({
      signedIn: true,
      pathname: '/',
      page: 1,
      provider,
    }),
    true
  );
});

test('explicit root sorts keep Live row; search Following Brand tag page2 guest hide it', () => {
  const provider = availableProvider();
  const base = { signedIn: true, pathname: '/', page: 1, provider };

  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { sort: 'latest' } }), true);
  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { sort: 'top' } }), true);
  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { sort: 'newest' } }), true);
  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { sort: 'oldest' } }), true);

  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { q: 'brakes' } }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, routeName: 'following' }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, searchParams: { onFollowing: true } }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, currentTag: { slug: () => 'toyota' } }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, stickyParams: { tags: 'ford' } }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, page: 2 }), false);
  assert.equal(shouldShowMainLiveChat({ ...base, signedIn: false }), false);
});

test('priority 120 sits above START 110, member pins 105, toolbar 100, discussion list 90', () => {
  assert.equal(MAIN_LIVE_CHAT_ITEM, 'flatrateMainLive');
  assert.equal(MAIN_LIVE_CHAT_PRIORITY, 120);
  assert.ok(MAIN_LIVE_CHAT_PRIORITY > START_BOARD_PIN_PRIORITY);
  assert.ok(MAIN_LIVE_CHAT_PRIORITY > 105);
  assert.ok(MAIN_LIVE_CHAT_PRIORITY > 100);
  assert.ok(MAIN_LIVE_CHAT_PRIORITY > 90);

  const list = fakeItemList();
  addStartBoardPinItem(list, { marker: 'start' });
  list.add('flatrateMainLandingPins', { marker: 'pins' }, 105);
  list.add('toolbar', { marker: 'toolbar' }, 100);
  list.add('discussionList', { marker: 'feed' }, 90);
  addMainLiveChatItem(list, { marker: 'live' });

  assert.equal(list.items[MAIN_LIVE_CHAT_ITEM].priority, 120);
  assert.equal(list.items[START_BOARD_PIN_ITEM].priority, 110);
  assert.equal(list.items.flatrateMainLandingPins.priority, 105);
  assert.equal(list.items.toolbar.priority, 100);
  assert.equal(list.items.discussionList.priority, 90);

  const ordered = Object.entries(list.items)
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([key]) => key);
  assert.deepEqual(ordered, [
    MAIN_LIVE_CHAT_ITEM,
    START_BOARD_PIN_ITEM,
    'flatrateMainLandingPins',
    'toolbar',
    'discussionList',
  ]);
});

test('single injection: repeated add keeps exactly one Live row', () => {
  const list = fakeItemList();
  addMainLiveChatItem(list, { marker: 'a' });
  addMainLiveChatItem(list, { marker: 'b' });
  addMainLiveChatItem(list, { marker: 'c' });
  assert.equal(Object.keys(list.items).length, 1);
  assert.equal(list.items[MAIN_LIVE_CHAT_ITEM].content.marker, 'c');
  removeMainLiveChatItem(list);
  assert.equal(list.items[MAIN_LIVE_CHAT_ITEM], undefined);
});

test('count presentation: positive, valid zero, unknown (no invented zero)', () => {
  assert.deepEqual(formatLiveCountPresentation(4), {
    text: '4 LIVE',
    ariaLabel: '4 members live',
    known: true,
  });
  assert.deepEqual(formatLiveCountPresentation(0), {
    text: '0 LIVE',
    ariaLabel: '0 members live',
    known: true,
  });
  assert.deepEqual(formatLiveCountPresentation(null), {
    text: 'LIVE',
    ariaLabel: 'Live presence count unavailable',
    known: false,
  });
  assert.equal(formatLiveCountPresentation(undefined).known, false);
  assert.equal(formatLiveCountPresentation(Number.NaN).known, false);
});

test('canonical Messages href from provider; fallback canonical; reject non-Messages', () => {
  assert.equal(resolveMainLiveHref(availableProvider()), CANONICAL_MAIN_LIVE_HREF);
  assert.equal(
    resolveMainLiveHref(availableProvider({ href: () => '/messages/live/community-general-live' })),
    '/messages/live/community-general-live'
  );
  assert.equal(
    resolveMainLiveHref(availableProvider({ href: () => '/live/community-general-live' })),
    CANONICAL_MAIN_LIVE_HREF
  );
  assert.equal(resolveMainLiveHref(null), CANONICAL_MAIN_LIVE_HREF);
});

test('component wires accessibility, toggle isolation, and provider-only contract', () => {
  assert.match(pinSrc, /Open FlatRate\.wiki General Live/);
  assert.match(pinSrc, /Keep me live while browsing/);
  assert.match(pinSrc, /role="switch"/);
  assert.match(pinSrc, /aria-checked/);
  assert.match(pinSrc, /stopPropagation/);
  assert.match(pinSrc, /preventDefault/);
  assert.match(pinSrc, /setUserLive/);
  assert.match(pinSrc, /FlatRateMainLiveChat/);
  assert.match(pinSrc, /data-flatrate-main-live="true"/);
  assert.doesNotMatch(pinSrc, /flatrateLiveRealtime/);
  assert.doesNotMatch(pinSrc, /Centrifuge/);
  assert.doesNotMatch(pinSrc, /presence-stats/);
  assert.doesNotMatch(pinSrc, /ChatState/);
  assert.doesNotMatch(pinSrc, /createRecord\(\s*['"]discussions['"]\s*\)/);
  assert.doesNotMatch(pinSrc, /isSticky|is_sticky/);
});

test('index wires Live before START/pins and fails closed on public MAIN', () => {
  assert.match(indexSrc, /MainLiveChatPin/);
  assert.match(indexSrc, /shouldShowMainLiveChat/);
  assert.match(indexSrc, /addMainLiveChatItem/);
  assert.match(indexSrc, /removeMainLiveChatItem/);
  assert.match(indexSrc, /getLiveMainProvider/);
  assert.match(indexSrc, /contentItems/);
  // Public path removes Live before early return.
  assert.match(indexSrc, /removeMainLiveChatItem\(items\);/);
  assert.doesNotMatch(indexSrc, /OFFLINE/);
  assert.doesNotMatch(utilSrc, /OFFLINE/);
  assert.doesNotMatch(pinSrc, /OFFLINE/);
});

test('presentation CSS keeps the General Live row compact with title left and lime status right', () => {
  assert.match(less, /\.FlatRateMainLiveChat\b/);
  assert.match(less, /\.FlatRateMainLiveChat-row\b/);
  assert.match(
    less,
    /\.FlatRateMainLiveChat-body\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto;/
  );
  assert.match(
    less,
    /\.FlatRateMainLiveChat-title\s*\{[\s\S]*?justify-self:\s*start;[\s\S]*?text-transform:\s*uppercase;/
  );
  assert.match(
    less,
    /\.FlatRateMainLiveChat-meta\s*\{[\s\S]*?justify-self:\s*end;[\s\S]*?color:\s*#66ff00;[\s\S]*?text-align:\s*right;/
  );
  assert.match(
    less,
    /\.FlatRateMainLiveChat-toggle\s*\{[\s\S]*?display:\s*none !important;/
  );
  assert.match(less, /min-height: 44px/);
  assert.match(less, /@media \(max-width: 420px\)/);
  assert.doesNotMatch(less, /FlatRateMainLiveChat-timestamp/);
  assert.doesNotMatch(less, /FlatRateMainLiveChat-votes/);
  assert.doesNotMatch(less, /FlatRateMainLiveChat-replies/);
  assert.doesNotMatch(less, /FlatRateMainLiveChat-author/);
});

test('getLiveMainProvider reads app.flatRateLiveMain only', () => {
  assert.equal(getLiveMainProvider(null), null);
  assert.equal(getLiveMainProvider({}), null);
  const provider = availableProvider();
  assert.equal(getLiveMainProvider({ flatRateLiveMain: provider }), provider);
});

test('Component oninit calls super.oninit(vnode)', () => {
  assert.match(pinSrc, /oninit\(vnode\)\s*\{[\s\S]*?super\.oninit\(vnode\);/);
});
