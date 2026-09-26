#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('mobile new-discussion plus uses the primary pink accent', () => {
  assert.match(less, /\.IndexPage \.FlatRateInlineNewDiscussion/);
  assert.match(less, /color: var\(--primary-color\) !important/);
});

test('mobile follow control is pinned to the right edge', () => {
  assert.match(less, /\.IndexPage \.App-primaryControl\s*\{\s*right: 8px !important;/);
  assert.match(less, /\.IndexPage-nav \.SubscriptionButton\s*\{\s*right: 0 !important;/);
});

test('center trigger is FLATRATE.WIKI with a down chevron only and true header centering', () => {
  assert.match(less, /content: "FLATRATE\.WIKI"/);
  assert.match(less, /\.Button-caret\.fa-sort::before/);
  assert.match(less, /content: "\\f078"/);
  assert.doesNotMatch(less, /content: "\\\\f078"/);
  assert.match(less, /> \.icon:not\(\.Button-caret\)/);
  assert.match(less, /\.App-header \.App-titleControl/);
  assert.match(less, /top: 50% !important/);
  assert.match(less, /left: 50% !important/);
  assert.match(less, /transform: translate\(-50%, -50%\) !important/);
  assert.match(less, /width: max-content !important/);
  assert.match(less, /\.Dropdown-toggle \.Button-caret/);
  assert.match(less, /margin: 0 !important/);
});

test('center-menu MAIN is transparent and shares the centered Brand column', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.item-allDiscussions > a/);
  assert.match(less, /background: transparent !important/);
  assert.match(less, /width: 15rem/);
  assert.match(less, /max-width: calc\(100% - 40px\)/);
  assert.match(less, /justify-content: flex-start/);
  assert.match(less, /text-align: left/);
  assert.match(less, /\.FlatRateDiscussionPicker-home/);
});

test('center-menu brands use a centered left-aligned column with consistent child indentation', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.FlatRatePresentationNav-brandLink/);
  assert.match(less, /width: 15rem/);
  assert.match(less, /max-width: calc\(100% - 40px\)/);
  assert.match(less, /flatrate-mobile-nav-rail-offset/);
  assert.match(less, /margin-right: auto/);
  assert.match(less, /justify-content: flex-start/);
  assert.match(less, /text-align: left/);
  assert.match(less, /\.FlatRatePresentationNav-brand\.depth-1/);
  assert.match(less, /padding-left: 1\.5rem !important/);
  assert.match(less, /\.FlatRatePresentationNav-brand\.depth-2/);
  assert.match(less, /padding-left: 3rem !important/);
  assert.match(less, /\.FlatRatePresentationNav-brandLink \.icon/);
  assert.match(less, /display: none !important/);
});


test('mobile Follow is star-only while preserving the FoF SubscriptionButton mutation surface', () => {
  assert.match(less, /\.IndexPage-nav \.SubscriptionButton \.Button-label/);
  assert.match(less, /\.IndexPage-nav \.SubscriptionButton \.Button-caret/);
  assert.match(less, /display: none !important/);
  assert.match(less, /font-size: 24px !important/);
  assert.match(less, /width: 44px !important/);
});

test('center label itself owns the header centerline while the caret is positioned outside its width', () => {
  assert.match(less, /\.App-titleControl > \.Dropdown-toggle\s*\{[^}]*position: relative/s);
  assert.match(less, /\.Dropdown-toggle \.Button-caret\s*\{[^}]*position: absolute !important/s);
  assert.match(less, /left: calc\(100% \+ 0\.45rem\)/);
});

test('both mobile Brand menus use a left-aligned label/count tab stop and zero totals are omitted', () => {
  assert.match(less, /\.App-drawer \.FlatRatePresentationNav-brandName/);
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.FlatRatePresentationNav-brandName/);
  assert.match(less, /flex: 0 0 10rem/);
  assert.match(less, /margin-left: 1\.25rem/);
  assert.match(less, /\.FlatRateDiscussionBrandName\s*\{[^}]*flex: 0 0 10rem/s);
  assert.match(less, /\.FlatRateBrandVoteTotal\[aria-label\*="board total: 0 upvotes"\]/);
});

test('canonical Brand hero suppresses the redundant native tag icon', () => {
  assert.match(less, /\.TagHero:has\(\.FlatRateBrandTagline\) \.Hero-title \.icon/);
});
