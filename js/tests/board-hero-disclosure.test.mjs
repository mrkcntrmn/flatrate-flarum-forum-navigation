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

test('MAIN replaces permanent dismissal with a fresh collapsed disclosure', () => {
  assert.match(source, /override\(WelcomeHero\.prototype, 'isHidden'/);
  assert.match(source, /items\.remove\('dismiss-button'\)/);
  assert.match(source, /this\.flatRateBoardHeroExpanded = false/);
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /MAIN_HERO_DETAILS_ID/);
});

test('all tag heroes use the same accessible toggle without dropping their title', () => {
  assert.match(index, /registerBoardHeroDisclosure\(TagHero\)/);
  assert.match(source, /extend\(TagHero\.prototype, 'contentItems'/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls/);
  assert.match(source, /FlatRateBoardHero-details/);
  assert.doesNotMatch(index, /omitNativeBrandHeroTitle/);
});

test('collapsed layout is centered, keyboard visible, and has a 44px target', () => {
  assert.match(less, /\.Hero\.FlatRateBoardHero \.Hero-title\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*center;/s);
  assert.match(less, /\.FlatRateBoardHero-toggleRow\s*\{[^}]*justify-content:\s*center;/s);
  assert.match(less, /\.FlatRateBoardHero-toggle\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(less, /\.FlatRateBoardHero-toggle:focus-visible/);
  assert.match(less, /FlatRateBoardHero--collapsed \.FlatRateBoardHero-details/);
});

