#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { shouldShowMainNotifications } from '../src/forum/utils/mainNotifications.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const index = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

test('brand top-right follow rules stay intact and the plane is not shown there', () => {
  assert.equal(shouldShowMainNotifications({
    signedIn: true,
    isIndexPage: true,
    pathname: '/',
    routeName: 'tag',
    searchParams: { tags: 'gm' },
    stickyParams: {},
    currentTag: { slug: () => 'gm' },
    page: 1,
  }), false);
  assert.match(less, /\.IndexPage-nav \.SubscriptionButton/);
  assert.match(less, /\.IndexPage \.App-primaryControl/);
  assert.match(index, /shouldShowMainNotifications/);
  assert.match(less, /#84cc16/);
  assert.match(less, /#c72d5d/);
  assert.match(less, /#ffffff/);
});
