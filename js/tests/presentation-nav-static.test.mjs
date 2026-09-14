#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'js/src/forum/components/PresentationNav.js'), 'utf8');
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
  assert.equal(manifest.groups[0].label, 'Push to Start');
  assert.equal(manifest.groups[0].destination.slug, 'start-here');
  assert.equal(manifest.groups.map((group) => group.label).includes('Community'), false);
});
