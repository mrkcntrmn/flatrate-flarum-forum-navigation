#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('brand tags use their native Flarum styling', () => {
  assert.doesNotMatch(index, /brandTagLabels/);
  assert.doesNotMatch(index, /registerBrandTagLabels/);
  assert.doesNotMatch(less, /FlatRateBrandTagLabel/);
  assert.doesNotMatch(less, /--tag-bg:\s*#c72d5d/);
});
