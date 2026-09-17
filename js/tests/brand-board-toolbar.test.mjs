#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const boardLess = readFileSync(join(root, 'resources/less/brand-board-toolbar.less'), 'utf8');
const extendPhp = readFileSync(join(root, 'extend.php'), 'utf8');

test('brand board toolbar replaces refresh and mark-all-read with inline compose', () => {
  assert.match(discussionSrc, /extend\(IndexPage\.prototype, 'actionItems'/);
  assert.match(discussionSrc, /items\.remove\('refresh'\)/);
  assert.match(discussionSrc, /items\.remove\('markAllAsRead'\)/);
  assert.match(discussionSrc, /'newDiscussion'/);
  assert.match(discussionSrc, /icon="fas fa-plus"/);
  assert.match(discussionSrc, /FlatRateInlineNewDiscussion/);
  assert.match(discussionSrc, /this\.newDiscussionAction\(\)/);
});

test('new discussion no longer occupies the phone primary-control slot', () => {
  assert.match(discussionSrc, /extend\(IndexPage\.prototype, 'sidebarItems'/);
  assert.match(discussionSrc, /items\.remove\('newDiscussion'\)/);
});

test('brand board content suppresses redundant car glyphs without changing tag metadata', () => {
  assert.match(boardLess, /\.TagHero \.Hero-title \.fa-car/);
  assert.match(boardLess, /\.TagLabel \.fa-car/);
  assert.match(boardLess, /display: none !important/);
  assert.match(extendPhp, /brand-board-toolbar\.less/);
});
