#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('center popup hides Following and START without removing other navigation copies', () => {
  assert.match(less, /\.App-titleControl \.item-following/);
  assert.match(less, /\.App-titleControl \.FlatRatePresentationNav-item--community/);
  assert.match(less, /\.App-drawer \.item-flatrateDrawerFollowing/);
  assert.match(less, /\.App-drawer \.item-flatrateDrawerStart/);
});

test('center popup presents All Discussions as centered HOME with warehouse glyph', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.item-allDiscussions > a/);
  assert.match(less, /justify-content: center/);
  assert.match(less, /content: "HOME"/);
  assert.match(less, /content: "\\f494"/);
  assert.match(less, /font-family: "Font Awesome 5 Free"/);
  assert.match(less, /font-weight: 900/);
});

test('center popup presents Brand boards as SelectDropdown LinkButton rows', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.FlatRateDiscussionBrandLink/);
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.FlatRateDiscussionBrandLink\.depth-1/);
});
