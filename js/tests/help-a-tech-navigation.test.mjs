#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import { discussionCanonicalHref } from '../src/forum/utils/helpATechNavigation.js';

test('NAVIGATION: canonical route with id and slug', () => {
  const d = { id: () => 101, slug: () => '2019-f150-cam-phaser' };
  assert.equal(discussionCanonicalHref(d), '/d/101-2019-f150-cam-phaser');
});

test('NAVIGATION: canonical route with id only', () => {
  const d = { id: () => 202, slug: () => '' };
  assert.equal(discussionCanonicalHref(d), '/d/202');
});

test('NAVIGATION: null or missing discussion falls back to root', () => {
  assert.equal(discussionCanonicalHref(null), '/');
  assert.equal(discussionCanonicalHref({}), '/');
});

test('NAVIGATION: excludes tracking query params or external redirects', () => {
  const d = { id: () => 303, slug: () => 'brake-pad-replacement' };
  const href = discussionCanonicalHref(d);
  assert.ok(!href.includes('?'));
  assert.ok(!href.includes('utm_'));
  assert.ok(!href.includes('redirect'));
  assert.ok(!href.startsWith('http://'));
  assert.ok(!href.startsWith('https://'));
});
