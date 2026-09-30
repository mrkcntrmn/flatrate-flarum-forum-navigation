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

test('center trigger is FLATRATE.WIKI with a visible down chevron and viewport centering', () => {
  assert.match(less, /content: "FLATRATE\.WIKI"/);
  assert.match(less, /\.Button-caret\.fa-sort::before/);
  assert.match(less, /content: "\\f078"/);
  assert.doesNotMatch(less, /content: "\\\\f078"/);
  assert.match(less, /> \.icon:not\(\.Button-caret\)/);
  assert.match(
    less,
    /\.App-titleControl\s*\{[^}]*left: 0 !important;[^}]*right: 0 !important;[^}]*width: max-content !important;[^}]*max-width: ~"calc\(100% - 120px\)";[^}]*margin-left: auto !important;[^}]*margin-right: auto !important;[^}]*transform: none !important;/s
  );
  assert.doesNotMatch(less, /transform: translateX\(-50%\) !important/);
  assert.doesNotMatch(less, /max-width: calc\(100% - 120px\)/);
  assert.doesNotMatch(less, /\.App-header \.App-titleControl\s*\{/);
  assert.match(
    less,
    /\.App-titleControl > \.Dropdown-toggle\s*\{[^}]*overflow: visible !important;[^}]*text-overflow: clip !important;/s
  );
  assert.match(less, /\.Dropdown-toggle \.Button-caret/);
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

test('center label itself owns the header centerline while the unclipped caret sits outside its width', () => {
  assert.match(less, /\.App-titleControl > \.Dropdown-toggle\s*\{[^}]*position: relative/s);
  assert.match(less, /\.Dropdown-toggle \.Button-caret\s*\{[^}]*position: absolute !important/s);
  assert.match(less, /left: 100%;/);
  assert.doesNotMatch(less, /left: ~"calc\(100% \+ 0\.45rem\)"/);
  assert.match(less, /padding-left: 0 !important/);
  assert.match(less, /padding-right: 0 !important/);
  assert.match(less, /overflow: visible !important/);
});

test('center popup is a viewport-fixed bottom-anchored half-screen sheet', () => {
  assert.match(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[^}]*position: fixed !important;[^}]*top: auto !important;[^}]*bottom: 0 !important;[^}]*left: 0 !important;[^}]*right: 0 !important;[^}]*width: 100vw !important;[^}]*max-width: 100vw;[^}]*height: 50dvh;[^}]*max-height: 50dvh;[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/s
  );
  assert.doesNotMatch(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[^}]*position: absolute !important;[^}]*top: 100% !important/
  );
  assert.doesNotMatch(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[^}]*left: ~"calc\(50% - 50vw\)"/
  );
  assert.doesNotMatch(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[^}]*max-height:\s*calc\(100dvh/
  );
  assert.doesNotMatch(less, /left: calc\(50% - 50vw\)/);
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
