#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  START_BOARD_PIN_ITEM,
  START_BOARD_PIN_PRIORITY,
  addStartBoardPinItem,
  removeStartBoardPinItem,
  shouldShowStartBoardPin,
} from '../src/forum/utils/startBoardPin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pinSrc = readFileSync(join(root, 'js/src/forum/components/StartBoardPin.js'), 'utf8');
const pinUtil = readFileSync(join(root, 'js/src/forum/utils/startBoardPin.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const centerPopupLessTests = readFileSync(join(root, 'js/tests/center-popup-menu.test.mjs'), 'utf8');

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

test('visibility: root HOME index shows the START board pin', () => {
  assert.equal(shouldShowStartBoardPin({ pathname: '/' }), true);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', searchParams: { sort: 'latest' } }), true);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', searchParams: { sort: 'top' } }), true);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', searchParams: { page: '2' } }), true);
  assert.equal(
    shouldShowStartBoardPin({ pathname: '/', searchParams: { sort: 'latest', page: '2' } }),
    true
  );
  assert.equal(shouldShowStartBoardPin({ pathname: '/', routeName: 'index' }), true);
});

test('visibility: search Following tag boards and other contexts hide the pin', () => {
  assert.equal(shouldShowStartBoardPin({ pathname: '/', searchParams: { q: 'brakes' } }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/following' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', routeName: 'following' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', searchParams: { onFollowing: true } }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/t/start-here' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/t/toyota' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', currentTag: { slug: () => 'toyota' } }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', stickyParams: { tags: 'ford' } }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/d/123-example' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/u/example' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', routeName: 'discussion' }), false);
  assert.equal(shouldShowStartBoardPin({ pathname: '/', routeName: 'user' }), false);
});

test('route authority: StartBoardPin uses pushToStartHref and START identity', () => {
  assert.match(pinSrc, /pushToStartHref/);
  assert.match(pinSrc, /START_NAV_LABEL/);
  assert.match(pinSrc, /START_NAV_ICON/);
  assert.match(pinSrc, /FlatRateStartBoardPin/);
  assert.match(pinSrc, /data-flatrate-start-board-pin="true"/);
  assert.match(pinSrc, /START_NAV_LABEL\} [^`]*pinned board/);
  assert.doesNotMatch(pinSrc, /href=\{['"]\/start['"]\}/);
  assert.doesNotMatch(pinSrc, /href=\{['"]\/community['"]\}/);
  assert.doesNotMatch(pinSrc, /['"]\/start-here['"]/);
  assert.match(indexSrc, /contentItems/);
  assert.match(indexSrc, /StartBoardPin/);
  assert.match(indexSrc, /shouldShowStartBoardPin/);
  assert.match(indexSrc, /addStartBoardPinItem/);
});

test('no Discussion model mutation in board-pin sources', () => {
  for (const src of [pinSrc, pinUtil, indexSrc]) {
    assert.doesNotMatch(src, /createRecord\(\s*['"]discussions['"]\s*\)/);
    assert.doesNotMatch(src, /new Discussion\b/);
    assert.doesNotMatch(src, /app\.discussions\.pages/);
    assert.doesNotMatch(src, /app\.discussions\.items/);
    assert.doesNotMatch(src, /app\.discussions\.push\b/);
    assert.doesNotMatch(src, /app\.discussions\.splice\b/);
  }
});

test('single injection: repeated addStartBoardPinItem keeps exactly one pin', () => {
  const list = fakeItemList();
  addStartBoardPinItem(list, { marker: 'pin-a' });
  addStartBoardPinItem(list, { marker: 'pin-b' });
  addStartBoardPinItem(list, { marker: 'pin-c' });

  assert.equal(START_BOARD_PIN_ITEM, 'flatrateStartBoardPin');
  assert.equal(START_BOARD_PIN_PRIORITY, 95);
  assert.equal(Object.keys(list.items).length, 1);
  assert.ok(list.items[START_BOARD_PIN_ITEM]);
  assert.equal(list.items[START_BOARD_PIN_ITEM].content.marker, 'pin-c');
  assert.equal(list.items[START_BOARD_PIN_ITEM].priority, 95);

  removeStartBoardPinItem(list);
  assert.equal(list.items[START_BOARD_PIN_ITEM], undefined);
});

test('presentation classes and lime START identity are present', () => {
  assert.match(less, /\.FlatRateStartBoardPin\b/);
  assert.match(less, /\.FlatRateStartBoardPin-link\b/);
  assert.match(less, /\.FlatRateStartBoardPin-pin\b/);
  assert.match(less, /\.FlatRateStartBoardPin-icon\b/);
  assert.match(less, /\.FlatRateStartBoardPin-label\b/);
  assert.match(less, /min-height: 44px/);
  assert.match(less, /#66ff00/);
  assert.match(pinSrc, /fas fa-thumbtack/);
  assert.match(pinSrc, /aria-hidden="true"/);
});

test('center popup contract tests remain authoritative (HOME + Brands, no START)', () => {
  assert.match(centerPopupLessTests, /center popup hides Following and START/);
  assert.match(centerPopupLessTests, /presents All Discussions as centered HOME/);
  assert.match(less, /\.App-titleControl \.FlatRatePresentationNav-item--community/);
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.item-allDiscussions > a/);
  assert.match(less, /\.App-drawer \.item-flatrateDrawerStart/);
});
