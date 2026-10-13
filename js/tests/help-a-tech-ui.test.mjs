#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { discussionCanonicalHref } from '../src/forum/utils/helpATechNavigation.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/help-a-tech.less'), 'utf8');
const helpATechSrc = readFileSync(join(root, 'js/src/forum/components/HelpATech.js'), 'utf8');

const sampleDiscussion = {
  id: () => 55,
  slug: () => '2020-ford-explorer-water-pump',
  title: () => '2020 Ford Explorer 3.0L Water Pump Replacement',
};

test('UI: canonical discussion href generated without tracking or redirect', () => {
  const href = discussionCanonicalHref(sampleDiscussion);
  assert.equal(href, '/d/55-2020-ford-explorer-water-pump');
  assert.ok(!href.includes('utm_'));
  assert.ok(!href.includes('ref='));
  assert.ok(!href.includes('redirect'));
});

test('UI: component source defines accessible landmark, semantic hierarchy, and canonical Link', () => {
  assert.match(helpATechSrc, /role="region"/);
  assert.match(helpATechSrc, /aria-label="Help a Tech discussion suggestions"/);
  assert.match(helpATechSrc, /HELP A TECH/);
  assert.match(helpATechSrc, /A few discussions where your experience might help\./);
  assert.match(helpATechSrc, /discussionCanonicalHref/);
  assert.match(helpATechSrc, /<Link\s+className="HelpATech-link"/);
  assert.match(helpATechSrc, /aria-hidden="true">›<\/span>/);
  assert.match(helpATechSrc, /HelpATech-contextBadge/);
});

test('UI: mobile touch targets and focus styles present in Less', () => {
  assert.ok(less.includes('min-height: 44px'));
  assert.ok(less.includes(':focus-visible'));
  assert.ok(less.includes('outline:'));
});
