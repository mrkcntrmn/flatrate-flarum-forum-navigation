#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { shouldShowMainNotifications } from '../src/forum/utils/mainNotifications.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const button = readFileSync(join(root, 'js/src/forum/components/MainNotificationsButton.js'), 'utf8');

test('guest MAIN does not mount a notifications control', () => {
  assert.equal(shouldShowMainNotifications({
    signedIn: false,
    isIndexPage: true,
    pathname: '/',
    routeName: 'index',
    searchParams: {},
    stickyParams: {},
    currentTag: null,
    page: 1,
  }), false);
  assert.match(button, /if \(!app\.session \|\| !app\.session\.user\)/);
  assert.match(button, /return null/);
});
