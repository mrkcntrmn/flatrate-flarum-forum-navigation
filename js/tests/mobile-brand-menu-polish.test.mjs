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

test('center trigger is FLATRATE.WIKI with a down chevron only', () => {
  assert.match(less, /content: "FLATRATE\.WIKI"/);
  assert.match(less, /\.Button-caret\.fa-sort::before/);
  assert.match(less, /content: "\\f078"/);
  assert.doesNotMatch(less, /content: "\\\\f078"/);
  assert.match(less, /> \.icon:not\(\.Button-caret\)/);
});

test('center-menu HOME is transparent with primary-color text and icon', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.item-allDiscussions > a/);
  assert.match(less, /background: transparent !important/);
  assert.match(less, /\.FlatRateDiscussionPicker-home/);
});

test('center-menu brands use a centered left-aligned column with consistent child indentation', () => {
  assert.match(less, /\.App-titleControl \.Dropdown-menu \.FlatRatePresentationNav-brandLink/);
  assert.match(less, /width: 15rem/);
  assert.match(less, /max-width: calc\(100% - 40px\)/);
  assert.match(less, /margin-left: auto/);
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
