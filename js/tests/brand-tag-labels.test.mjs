#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { isBrandTag } from '../src/forum/utils/brandTag.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const source = readFileSync(join(root, 'js/src/forum/brandTagLabels.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

const tag = (slug) => ({ slug: () => slug });

test('brand provenance comes from the manifest, including nested brands', () => {
  for (const slug of ['audi', 'bmw', 'gm', 'chevrolet', 'cdjr', 'jeep', 'jlr', 'range-rover']) {
    assert.equal(isBrandTag(tag(slug), manifest), true, slug);
  }
  for (const slug of ['general-shop-discussion', 'start-here', 'job-breakdown', 'labor-law-texas']) {
    assert.equal(isBrandTag(tag(slug), manifest), false, slug);
  }
});

test('native list and discussion-page tag items keep models, order, and links', () => {
  assert.match(source, /DiscussionListItem\.prototype, 'infoItems'/);
  assert.match(source, /DiscussionHero\.prototype, 'items'/);
  assert.match(source, /sortTags\(tags/);
  assert.match(source, /tagLabel\(tag/);
  assert.match(source, /link: false/);
  assert.match(source, /link: true/);
  assert.doesNotMatch(source, /\.save\(|color\(|localStorage/);
});

test('brand chips are pink and white through hover and focus', () => {
  assert.match(less, /\.TagLabel\.FlatRateBrandTagLabel[\s\S]*--tag-bg:\s*#c72d5d !important/);
  assert.match(less, /background-color:\s*#c72d5d !important/);
  assert.match(less, /color:\s*#ffffff !important/);
  assert.match(less, /FlatRateBrandTagLabel:hover/);
  assert.match(less, /FlatRateBrandTagLabel:focus-visible/);
});
