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
  assert.match(less, /\.App-drawer \.Header-secondary > \.Header-controls > \.item-search\s*\{[\s\S]*?order:\s*-30;/);
  assert.match(less, /\.App-drawer \.Header-secondary > \.Header-controls > \.item-session\s*\{[\s\S]*?order:\s*10;/);
});

test('phone drawer shows the concise Search placeholder while retaining the native input behavior', () => {
  assert.match(less, /\.App-drawer \.item-search \.Search-input::before\s*\{[\s\S]*?content:\s*"Search";/);
  assert.match(less, /\.App-drawer \.item-search \.FormControl::placeholder\s*\{[\s\S]*?color:\s*transparent\s*!important;/);
  assert.match(less, /\.App-drawer \.item-search \.Search-input:has\(\.FormControl:not\(:placeholder-shown\)\)::before/);
});
