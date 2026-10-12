#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const chrome = readFileSync(join(root, 'js/src/forum/discussionPhoneChrome.js'), 'utf8');
const jump = readFileSync(join(root, 'js/src/forum/components/DiscussionJumpToTop.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/discussion-center-menu.less'), 'utf8');

test('discussion top controls omit only the standalone discussion total', () => {
  assert.match(chrome, /removeItem\(items, 'flatRateDiscussionVote'\)/);
  assert.match(less, /\.DiscussionPage-nav \.item-flatRateDiscussionVote\s*\{[^}]*display:\s*none !important/s);
  assert.doesNotMatch(chrome, /replyCount/);
  assert.doesNotMatch(chrome, /BrandVoteTotal/);
});

test('discussion pages mount an accessible round jump-to-top control', () => {
  assert.match(chrome, /items\.add\('flatrateJumpToTop', <DiscussionJumpToTop \/>, 90\)/);
  assert.match(jump, /DISCUSSION_JUMP_TO_TOP_THRESHOLD = 480/);
  assert.match(jump, /window\.addEventListener\('scroll', this\.handleScroll, \{ passive: true \}\)/);
  assert.match(jump, /window\.removeEventListener\('scroll', this\.handleScroll\)/);
  assert.match(jump, /window\.scrollTo\(\{ top: 0, behavior: reduceMotion \? 'auto' : 'smooth' \}\)/);
  assert.match(jump, /aria-label="Jump to top"/);
  assert.match(jump, /tabindex=\{this\.visible \? 0 : -1\}/);
  assert.match(less, /\.FlatRateDiscussionJumpToTop\s*\{[^}]*position:\s*fixed;[^}]*width:\s*48px;[^}]*height:\s*48px;[^}]*border-radius:\s*50%;/s);
  assert.match(less, /calc\(76px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(less, /\.FlatRateDiscussionJumpToTop:focus-visible/);
});

test('solid discussion Follow stars are gold while outlines remain untouched', () => {
  assert.match(less, /\.FlatRateDiscussionFollowStar--followed\.App-primaryControl/);
  assert.match(less, /\.SubscriptionMenu \.fas\.fa-star/);
  assert.match(less, /color:\s*#f5c542 !important/);
  assert.doesNotMatch(less, /\.far\.fa-star[^}]*#f5c542/s);
});
