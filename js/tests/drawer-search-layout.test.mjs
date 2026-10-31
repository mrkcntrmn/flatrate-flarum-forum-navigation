#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('phone drawer promotes Search above the FlatRate.wiki header without changing desktop layout', () => {
  assert.match(less, /@media \(max-width: 767px\)/);
  assert.match(less, /\.App-drawer \.App-header \.container\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/);
  assert.match(less, /\.App-drawer \.Header-secondary,\s*\.App-drawer \.Header-secondary > \.Header-controls\s*\{\s*display:\s*contents;/);
  assert.match(less, /\.App-drawer \.item-search\s*\{[\s\S]*?order:\s*-30;/);
  assert.match(less, /\.App-drawer \.item-session\s*\{[\s\S]*?order:\s*-1;/);
  assert.match(less, /\.App-drawer \.Header-secondary > \.Header-controls > \.item-session\s*\{[\s\S]*?order:\s*10;/);
});

test('F2 phone drawer renders native GlobalSearch button without the old overlaid placeholder', () => {
  assert.match(less, /\\.App-drawer \\.item-search \\.Search-input\\s*\\{[^}]*display:\\s*flex;[^}]*align-items:\\s*center;/s);
  assert.match(less, /\\.App-drawer \\.item-search \\.Search-input \\.Button-icon\\s*\\{[^}]*position:\\s*static !important;/s);
  assert.match(less, /\\.App-drawer \\.item-search \\.Search-input \\.Button-label\\s*\\{[^}]*text-align:\\s*left;/s);
  assert.doesNotMatch(less, /\\.App-drawer \\.item-search \\.Search-input::before/);
  assert.doesNotMatch(less, /\\.App-drawer \\.item-search \\.FormControl::placeholder/);
});

test('F2 drawer hides Flags and theme switcher without suppressing moderation or theme features elsewhere', () => {
  assert.match(less, /\\.App-drawer \\.Header-controls > \\.item-flags,\\s*\\.App-drawer \\.Header-controls > \\.item-themeSwitcher\\s*\\{[^}]*display:\\s*none !important;/s);
  assert.doesNotMatch(less, /\\.Header-controls > \\.item-flags\\s*\\{/);
});

test('F2 index action toolbar suppresses duplicate search but preserves native GlobalSearch surfaces', () => {
  const source = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
  const start = source.indexOf("extend(IndexPage.prototype, 'actionItems'");
  assert.ok(start >= 0, 'IndexPage actionItems hook absent');
  assert.match(source.slice(start), /if \\(hasItem\\(items, 'search'\\)\\) \\{\\s*items\\.remove\\('search'\\);/);
  assert.match(source.slice(start), /items\\.add\\(\\s*'newDiscussion'/);
});
