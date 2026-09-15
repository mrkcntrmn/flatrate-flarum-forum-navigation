#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'js/src/forum/components/PresentationNav.js'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const startNav = readFileSync(join(root, 'js/src/forum/utils/startNav.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const dist = readFileSync(join(root, 'js/dist/forum.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));

function collectBoards(nodes, acc = []) {
  for (const node of nodes || []) {
    acc.push(node);
    collectBoards(node.children || [], acc);
  }
  return acc;
}

test('presentation nav has no collapse state or expander controls', () => {
  for (const needle of [
    'brandsExpanded',
    'expandedParents',
    'FlatRatePresentationNav-expander',
    'FlatRatePresentationNav-expanderIcon',
    'aria-expanded',
    'aria-controls',
    'onclick',
    'hidden={!',
    'is-collapsed',
    'is-expanded',
  ]) {
    assert.equal(src.includes(needle), false, `source still contains ${needle}`);
    assert.equal(dist.includes(needle), false, `dist still contains ${needle}`);
  }
});

test('mobile drawer search and Following presentation match the product contract', () => {
  assert.match(index, /from 'flarum\/forum\/components\/Search'/);
  assert.match(index, /node\.attrs\.placeholder = 'Search'/);
  assert.match(index, /extend\(Search\.prototype, 'view'/);
  assert.doesNotMatch(index, /flatrateDrawerFollowing/);
  assert.doesNotMatch(less, /flatrateDrawerFollowing/);

  assert.match(less, /\.App-drawer \.App-header > \.container/);
  assert.match(less, /\.App-drawer \.Header-secondary > \.Header-controls/);
  assert.match(less, /\.App-drawer \.Header-title/);
  assert.match(less, /order:\s*-20/);
  assert.match(less, /\.App-drawer \.item-search/);
  assert.match(less, /order:\s*-30/);
  assert.match(less, /\.App-drawer \.item-session/);
  assert.match(less, /order:\s*-10/);
});

test('followed brands are starred by the shared sidebar/title-sheet component', () => {
  assert.match(src, /flatrateFollowedBrandKeys/);
  assert.match(src, /FlatRatePresentationNav-followingStar/);
  assert.match(src, /Following \$\{board\.name\}/);
  assert.match(src, /fas fa-star/);
  assert.match(less, /\.FlatRatePresentationNav-followingStar/);
  assert.match(less, /color:\s*@primary-color/);
  assert.match(dist, /flatrateFollowedBrandKeys/);
  assert.match(dist, /FlatRatePresentationNav-followingStar/);
});

test('obsolete expander LESS is gone after becoming unused', () => {
  for (const needle of [
    'FlatRatePresentationNav-expander',
    'FlatRatePresentationNav-expanderIcon',
    'FlatRatePresentationNav-expanderSpacer',
    'is-collapsed',
  ]) {
    assert.equal(less.includes(needle), false, `less still contains ${needle}`);
  }
  assert.match(less, /\.FlatRatePresentationNav-brand\.depth-1/);
  assert.match(less, /\.item-flatrateDrawerNav/);
  assert.match(less, /min-width: 768px/);
  assert.match(less, /\.App-drawer \.item-flatrateDrawerNav/);
  assert.match(less, /\.App-titleControl \.FlatRatePresentationNav-item--brands/);
  assert.match(less, /text-align:\s*center/);
  assert.match(less, /display:\s*inline-block/);
  assert.match(less, /margin-left:\s*1\.25rem/);
  assert.match(less, /padding:\s*0\.75rem 10px 1rem/);
  assert.match(less, /padding-left:\s*13px/);
  assert.match(less, /padding:\s*15px 20px 15px 50px/);
  assert.match(less, /FlatRatePresentationNav-link--technician/);
  assert.match(less, /\.App-drawer \.item-LiveChats/);
  assert.match(less, /display:\s*none !important/);
  assert.match(less, /\.item-flatrateDrawerStart/);
  assert.match(less, /display:\s*contents/);
  assert.match(less, /FlatRatePresentationNav-item--community/);
  assert.match(less, /\.App-titleControl \.FlatRatePresentationNav-brandLink \.icon/);
  assert.match(less, /FlatRatePresentationNav-item--technician-topics/);
  assert.doesNotMatch(less, /padding-left:\s*70px/);
});

test('GM and CDJR children are always emitted as nested presentation', () => {
  assert.match(src, /children\.map\(\(child\) => this\.renderBrandNode\(child, depth \+ 1\)\)/);
  assert.match(src, /brandHref\(board\)/);
  assert.doesNotMatch(src, /hidden=\{/);

  const brands = manifest.groups.find((group) => group.id === 'brands');
  const boards = collectBoards(brands.boards);
  const byKey = Object.fromEntries(boards.map((board) => [board.boardKey, board]));

  assert.deepEqual(
    (byKey.gm.children || []).map((child) => child.name),
    ['Buick', 'Cadillac', 'Chevrolet', 'GMC']
  );
  assert.deepEqual(
    (byKey.cdjr.children || []).map((child) => child.name),
    ['Chrysler', 'Dodge', 'Jeep', 'Ram']
  );
  assert.equal(src.includes("boardKey === 'gm'"), false);
  assert.equal(src.includes('expandedParents'), false);
  assert.equal(src.includes("app.route('community')"), false);
  assert.match(src, /groupLinkHref\(group, this\.attrs\.manifest\)/);
  assert.match(src, /START_NAV_LABEL/);
  assert.match(src, /FlatRatePresentationNav-link--start/);
  assert.match(src, /TECHNICIAN_TOPICS_ICON/);
  assert.match(src, /FlatRatePresentationNav-link--technician/);
  assert.match(src, /BRAND_NAV_ICON/);
  assert.match(startNav, /fas fa-wrench/);
  assert.match(startNav, /fas fa-car/);
  assert.match(dist, /fa-wrench/);
  assert.match(dist, /fa-car/);
  assert.equal(src.includes('FlatRatePresentationNav-groupLabel'), false);
  assert.equal(dist.includes('FlatRatePresentationNav-groupLabel'), false);
  assert.equal(less.includes('FlatRatePresentationNav-groupLabel'), false);
  assert.match(less, /#66ff00/);
  assert.equal(manifest.groups[0].label, 'Push to Start');
  assert.equal(manifest.groups[0].destination.slug, 'start-here');
  assert.equal(manifest.groups.map((group) => group.label).includes('Community'), false);
});
