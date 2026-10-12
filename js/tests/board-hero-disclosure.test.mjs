#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const source = readFileSync(join(root, 'js/src/forum/boardHeroDisclosure.js'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('MAIN stays visible without dismissal or a disclosure control', () => {
  assert.match(source, /override\(WelcomeHero\.prototype, 'isHidden'/);
  assert.match(source, /items\.remove\('dismiss-button'\)/);
  assert.doesNotMatch(source, /flatRateBoardHeroExpanded/);
  assert.doesNotMatch(source, /fa-chevron/);
  assert.doesNotMatch(source, /aria-expanded/);
});

test('all tag heroes use the same static centered banner', () => {
  assert.match(index, /registerBoardHeroDisclosure\(TagHero\)/);
  assert.match(source, /extend\(TagHero\.prototype, 'view'/);
  assert.match(source, /FlatRateBoardHero--static/);
  assert.doesNotMatch(source, /contentItems/);
  assert.doesNotMatch(index, /omitNativeBrandHeroTitle/);
});

test('static banner CSS keeps titles centered without toggle or collapsed rules', () => {
  assert.match(less, /\.Hero\.FlatRateBoardHero \.Hero-title\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*center;/s);
  assert.doesNotMatch(less, /FlatRateBoardHero-toggle/);
  assert.doesNotMatch(less, /FlatRateBoardHero--collapsed/);
  assert.doesNotMatch(less, /FlatRateBoardHero-details/);
});
