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
  assert.doesNotMatch(helper, /board\.parent|board\.children|familyOf|listDirectBrandChildren/);
  assert.match(component, /is-followed/);
  assert.match(less, /\.FlatRateBrandVoteTotal\.is-followed/);
  assert.match(less, /#84cc16/);
  assert.match(less, /#c72d5d/);
});

test('Brand totals render for PresentationNav and hero, and center-sheet CSS suppresses them', () => {
  assert.match(nav, /<BrandVoteTotal board=\{board\}/);
  assert.doesNotMatch(center, /BrandVoteTotal/);
  assert.doesNotMatch(center, /<BrandVoteTotal board=\{board\}/);
  assert.match(index, /<BrandVoteTotal board=\{board\} key="flatrate-brand-vote-total"/);

  const centerTotal = less.match(
    /\.App-titleControl \.Dropdown-menu \.FlatRatePresentationNav-brandLink \.FlatRateBrandVoteTotal\s*\{([^}]*)\}/
  );
  assert.ok(centerTotal, 'IndexPage center-sheet Brand total rule is missing');
  assert.match(centerTotal[1], /display:\s*none !important/);
  assert.doesNotMatch(centerTotal[1], /flex:\s*0 0 auto/);
  assert.doesNotMatch(centerTotal[1], /margin-left:\s*1\.25rem/);

  const centerName = less.match(
    /\.App-titleControl \.Dropdown-menu \.FlatRatePresentationNav-brandName\s*\{([^}]*)\}/
  );
  assert.ok(centerName, 'IndexPage center-sheet Brand name rule is missing');
  assert.match(centerName[1], /flex:\s*1 1 auto/);
  assert.doesNotMatch(centerName[1], /flex:\s*0 0 10rem/);

  const drawerTotal = less.match(
    /\.App-drawer \.FlatRatePresentationNav-brandLink \.FlatRateBrandVoteTotal\s*\{([^}]*)\}/
  );
  assert.ok(drawerTotal, 'drawer Brand total rule is missing');
  assert.match(drawerTotal[1], /margin-left:\s*1\.25rem/);
  assert.doesNotMatch(drawerTotal[1], /display:\s*none/);

  assert.doesNotMatch(
    less,
    /\.TagHero \.Hero-title \.FlatRateBrandVoteTotal\s*\{[^}]*display:\s*none/
  );
  assert.doesNotMatch(
    less,
    /\.IndexPage-nav[^{]*\.FlatRateBrandVoteTotal\s*\{[^}]*display:\s*none/
  );
});

test('Brand hero attaches the total to the native Hero title', () => {
  assert.match(index, /findHeroTitle/);
  assert.match(index, /containerNarrow/);
  assert.match(index, /nodeClass\.includes\('Hero-title'\)/);
  assert.match(index, /titleChildren\.push/);
  assert.match(index, /flatrate-brand-vote-total/);
  assert.match(less, /\.TagHero \.Hero-title \.FlatRateBrandVoteTotal/);
  // Compat may export the class directly; bare `.default` leaves TagHero undefined.
  assert.match(
    index,
    /TagHeroModule\.default \? TagHeroModule\.default : TagHeroModule/
  );
  assert.doesNotMatch(index, /require\('flarum\/tags\/components\/TagHero'\)\.default/);
});

test('Brand totals are read-only and have an accessible label', () => {
  assert.match(component, /aria-label=\{label\}/);
  assert.match(component, /board total:/);
  assert.doesNotMatch(component, /onclick|Button|save\(|request\(/);
});
