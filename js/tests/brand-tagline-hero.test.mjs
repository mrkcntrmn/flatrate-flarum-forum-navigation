#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  brandTaglineByKey,
  resolveBrandTagline,
  taglineKeysWithoutBrandNode,
  PENDING_JLR_BRAND_KEYS,
} from '../src/forum/utils/brandTagline.js';
import { listDirectBrandChildren, findBrandNodeBySlug } from '../src/forum/utils/brandNode.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const taglinesJson = JSON.parse(readFileSync(join(root, 'resources/brand-taglines.json'), 'utf8'));
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const familySrc = readFileSync(join(root, 'js/src/forum/components/BrandFamilyLinks.js'), 'utf8');

test('mandatory brand taglines resolve from the package snapshot', () => {
  assert.equal(brandTaglineByKey('bmw'), 'The Ultimate Driving Machine');
  assert.equal(brandTaglineByKey('jlr'), 'Reimagine');
  assert.equal(brandTaglineByKey('jaguar'), 'Grace, Space, Pace');
  assert.equal(brandTaglineByKey('land-rover'), 'Above and Beyond');
  assert.equal(brandTaglineByKey('range-rover'), 'The Original Luxury SUV');
  assert.equal(brandTaglineByKey('gm'), 'Mark of Excellence');
  assert.equal(brandTaglineByKey('cdjr'), 'Mopar');
});

test('tagline projection is Brand-only and does not invent routes', () => {
  assert.equal(
    resolveBrandTagline({ currentTag: { slug: () => 'bmw' }, manifest }),
    'The Ultimate Driving Machine'
  );
  assert.equal(resolveBrandTagline({ currentTag: { slug: () => 'start-here' }, manifest }), null);
  assert.equal(resolveBrandTagline({ currentTag: { slug: () => 'job-breakdown' }, manifest }), null);
});

test('tagline catalog keys map to known brands or pending JLR control set', () => {
  const unknown = taglineKeysWithoutBrandNode(manifest);
  assert.deepEqual(unknown, []);
  for (const key of PENDING_JLR_BRAND_KEYS) {
    assert.ok(taglinesJson.taglines.some((entry) => entry.key === key));
  }
  assert.equal(taglinesJson.jlrHierarchyControl, 'BLOCKED_UNTIL_548');
});

test('parent brand family links are manifest-driven direct children only', () => {
  const gm = findBrandNodeBySlug(manifest, 'gm');
  const cdjr = findBrandNodeBySlug(manifest, 'cdjr');
  const bmw = findBrandNodeBySlug(manifest, 'bmw');
  const chevrolet = findBrandNodeBySlug(manifest, 'chevrolet');

  assert.deepEqual(
    listDirectBrandChildren(gm).map((child) => child.name),
    ['Buick', 'Cadillac', 'Chevrolet', 'GMC']
  );
  assert.deepEqual(
    listDirectBrandChildren(cdjr).map((child) => child.name),
    ['Chrysler', 'Dodge', 'Jeep', 'Ram']
  );
  assert.deepEqual(listDirectBrandChildren(bmw), []);
  assert.deepEqual(listDirectBrandChildren(chevrolet), []);

  assert.doesNotMatch(familySrc, /if \(.*GM/);
  assert.doesNotMatch(familySrc, /boardKey === ['"]gm['"]/);
  assert.doesNotMatch(familySrc, /boardKey === ['"]cdjr['"]/);
  assert.doesNotMatch(familySrc, /boardKey === ['"]jlr['"]/);
  assert.match(familySrc, /listDirectBrandChildren/);
  assert.match(indexSrc, /BrandFamilyLinks/);
  assert.match(indexSrc, /resolveBrandTagline/);
});

test('JLR hierarchy is not invented in the navigation runtime manifest yet', () => {
  const brands = manifest.groups.find((group) => group.id === 'brands');
  const slugs = [];
  function walk(board) {
    slugs.push(board.slug);
    (board.children || []).forEach(walk);
  }
  (brands.boards || []).forEach(walk);
  assert.ok(slugs.includes('jaguar'));
  assert.equal(slugs.includes('jlr'), false);
  assert.equal(slugs.includes('land-rover'), false);
  assert.equal(slugs.includes('range-rover'), false);
});
