#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { findBrandNodeBySlug } from '../src/forum/utils/brandNode.js';
import { parentBrandBannerModel } from '../src/forum/utils/parentBrandBanner.js';
import { brandTaglineByKey } from '../src/forum/utils/brandTagline.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const bannerSrc = readFileSync(join(root, 'js/src/forum/components/ParentBrandBanner.js'), 'utf8');
const linksSrc = readFileSync(join(root, 'js/src/forum/components/BrandFamilyLinks.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

test('CDJR collapsed banner keeps the tagline and child links without the parent name or total', () => {
  const board = findBrandNodeBySlug(manifest, 'cdjr');
  const model = parentBrandBannerModel({ board, tagline: brandTaglineByKey('cdjr') });
  assert.equal(model.disclosure, true);
  assert.equal(model.tagline, 'Mopar');
  assert.deepEqual(model.childNames, ['Chrysler', 'Dodge', 'Jeep', 'Ram']);
  assert.equal(model.showsParentName, false);
  assert.equal(model.showsParentTotal, false);
  assert.equal(model.childNames.includes('CDJR'), false);
});

test('GM and JLR collapsed banners follow the same manifest order', () => {
  assert.deepEqual(
    parentBrandBannerModel({ board: findBrandNodeBySlug(manifest, 'gm'), tagline: brandTaglineByKey('gm') }),
    {
      disclosure: true,
      tagline: 'Mark of Excellence',
      childNames: ['Buick', 'Cadillac', 'Chevrolet', 'GMC'],
      showsParentName: false,
      showsParentTotal: false,
    }
  );
  assert.equal(
    parentBrandBannerModel({ board: findBrandNodeBySlug(manifest, 'jlr'), tagline: brandTaglineByKey('jlr') }).tagline,
    'Reimagine'
  );
  assert.deepEqual(
    parentBrandBannerModel({ board: findBrandNodeBySlug(manifest, 'jlr') }).childNames,
    ['Jaguar', 'Land Rover', 'Range Rover']
  );
});

test('leaf boards do not render an empty family disclosure', () => {
  for (const slug of ['volkswagen', 'jeep', 'chevrolet']) {
    const model = parentBrandBannerModel({
      board: findBrandNodeBySlug(manifest, slug),
      tagline: brandTaglineByKey(slug),
    });
    assert.equal(model.disclosure, false);
    assert.deepEqual(model.childNames, []);
  }
});

test('child links and the chevron do not share a click handler', () => {
  assert.match(bannerSrc, /FlatRateParentBrandBanner-toggle/);
  assert.match(bannerSrc, /aria-expanded/);
  assert.match(bannerSrc, /aria-controls/);
  assert.match(bannerSrc, /<BrandFamilyLinks/);
  assert.match(linksSrc, /<Link/);
  assert.doesNotMatch(linksSrc, /expanded = !/);
  assert.match(bannerSrc, /stopPropagation/);
});


test('TagHero is resolved inside the post-tags initializer rather than at bundle evaluation time', () => {
  assert.match(indexSrc, /function resolveTagHero\(\)/);
  assert.match(indexSrc, /const TagHero = resolveTagHero\(\);/);
  assert.match(indexSrc, /require\('flarum\/tags\/components\/TagHero'\)/);
  assert.doesNotMatch(indexSrc, /let TagHero;\s*try \{/);
});
