#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolveBrandFamilySlugs } from '../src/forum/utils/brandFamilyFeed.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const filterSrc = readFileSync(join(root, 'src/Search/Filter/BrandFamilyTagFilter.php'), 'utf8');
const extendSrc = readFileSync(join(root, 'extend.php'), 'utf8');

test('parent Brand families include the parent and manifest descendants once', () => {
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'cdjr'), ['cdjr', 'chrysler', 'dodge', 'jeep', 'ram']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'gm'), ['gm', 'buick', 'cadillac', 'chevrolet', 'gmc']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'jlr'), ['jlr', 'jaguar', 'land-rover', 'range-rover']);
});

test('leaf Brand feeds and unknown slugs stay exact', () => {
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'jeep'), ['jeep']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'chevrolet'), ['chevrolet']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'jaguar'), ['jaguar']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'volkswagen'), ['volkswagen']);
  assert.deepEqual(resolveBrandFamilySlugs(manifest, 'not-a-brand'), ['not-a-brand']);
  assert.deepEqual(resolveBrandFamilySlugs(null, 'cdjr'), ['cdjr']);
  assert.deepEqual(resolveBrandFamilySlugs({ groups: 'bad' }, 'cdjr'), ['cdjr']);
});

test('family expansion is one server filter, not client concatenation', () => {
  assert.match(filterSrc, /parent::constrain/);
  assert.match(filterSrc, /BrandFamilySlugs::expandList/);
  assert.doesNotMatch(filterSrc, /file_get_contents\('https?:/);
  assert.doesNotMatch(filterSrc, /curl_/);
  assert.match(extendSrc, /ReplaceBrandFamilyTagFilter/);
  assert.doesNotMatch(readFileSync(join(root, 'js/src/forum/index.js'), 'utf8'), /\/api\/discussions\?.*chrysler/);
});
