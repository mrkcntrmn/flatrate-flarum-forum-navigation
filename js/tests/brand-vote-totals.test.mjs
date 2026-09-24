#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const helper = readFileSync(join(root, 'js/src/forum/utils/brandVoteTotals.js'), 'utf8');
const component = readFileSync(join(root, 'js/src/forum/components/BrandVoteTotal.js'), 'utf8');
const nav = readFileSync(join(root, 'js/src/forum/components/PresentationNav.js'), 'utf8');
const center = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('Brand totals consume the FlatRate forum-bootstrap aggregate', () => {
  assert.match(helper, /flatRateBrandUpvotes/);
  assert.match(helper, /Object\.prototype\.hasOwnProperty/);
  assert.match(helper, /return null/);
  assert.doesNotMatch(helper, /post_votes|discussion_tag|fetch\(|app\.request/);
});

test('exact positive Follow state recolors only presentation', () => {
  assert.match(helper, /subscription === 'follow' \|\| subscription === 'lurk'/);
  assert.doesNotMatch(helper, /family|parent|children/);
  assert.match(component, /is-followed/);
  assert.match(less, /\.FlatRateBrandVoteTotal\.is-followed/);
  assert.match(less, /#84cc16/);
  assert.match(less, /#c72d5d/);
});

test('same Brand total component is reused in all required surfaces', () => {
  assert.match(nav, /<BrandVoteTotal board=\{board\}/);
  assert.match(center, /<BrandVoteTotal board=\{board\}/);
  assert.match(index, /<BrandVoteTotal board=\{board\} key="flatrate-brand-vote-total"/);
});

test('Brand hero attaches the total to the native Hero title', () => {
  assert.match(index, /titleClass\.includes\('Hero-title'\)/);
  assert.match(index, /titleChildren\.push/);
  assert.match(index, /flatrate-brand-vote-total/);
  assert.match(less, /\.TagHero \.Hero-title \.FlatRateBrandVoteTotal/);
});

test('Brand totals are read-only and have an accessible label', () => {
  assert.match(component, /aria-label=\{label\}/);
  assert.match(component, /board total:/);
  assert.doesNotMatch(component, /onclick|Button|save\(|request\(/);
});
