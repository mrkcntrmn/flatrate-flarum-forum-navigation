#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('phone hamburger hides Messages, Following, and START shortcuts', () => {
  assert.match(less, /@media \(max-width: 767px\)/);
  assert.match(
    less,
    /\.App-drawer \.item-FlatRateMessages,\s*\.App-drawer \.item-flatrateDrawerFollowing,\s*\.App-drawer \.item-flatrateDrawerStart\s*\{\s*display:\s*none\s*!important;/
  );
});

test('shortcut removal remains phone-drawer scoped', () => {
  assert.doesNotMatch(less, /(^|\n)\.item-FlatRateMessages\s*\{\s*display:\s*none\s*!important;/);
  assert.doesNotMatch(less, /@media \(min-width: 768px\)[\s\S]*?\.item-FlatRateMessages/);
});
