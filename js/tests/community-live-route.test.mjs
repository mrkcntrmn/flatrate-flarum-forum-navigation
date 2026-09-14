#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  CANONICAL_GENERAL_LIVE_ROUTE,
  resolveGeneralLiveHref,
} from '../src/forum/utils/generalLiveRoute.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const navSrc = readFileSync(join(root, 'js/src/forum/components/PresentationNav.js'), 'utf8');

test('embedded manifest exposes exact General Live and Push to Start metadata', () => {
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.generalLive.available, true);
  assert.equal(manifest.generalLive.roomKey, 'community-general-live');
  assert.equal(manifest.generalLive.route, CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(manifest.pushToStart.slug, 'start-here');
  assert.equal(manifest.legacyCommunity.route, '/community');
  assert.equal(manifest.legacyCommunity.redirectTarget, '/t/start-here');
  assert.equal(Object.prototype.hasOwnProperty.call(manifest, 'community'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest.groups[0], 'boards'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest.groups[1], 'boards'), false);
});

test('Community landing page is retired', () => {
  assert.doesNotMatch(indexSrc, /CommunityPage/);
  assert.doesNotMatch(indexSrc, /app\.routes\.community/);
  assert.doesNotMatch(navSrc, /app\.route\('community'\)/);
  assert.equal(manifest.groups[0].label, 'Push to Start');
  assert.deepEqual(manifest.groups[0].destination, {
    type: 'tag',
    boardKey: 'start-here',
    slug: 'start-here',
  });
  assert.equal(
    manifest.groups.map((group) => group.label).includes('Community'),
    false,
    'PUBLIC_NAV_CONTAINS_COMMUNITY must be false'
  );
});

test('live href prefers valid runtime override, else manifest, never #', () => {
  assert.equal(resolveGeneralLiveHref({ manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(
    resolveGeneralLiveHref({ runtimeRoute: '/live/other-room', manifest }),
    '/live/other-room'
  );
  assert.equal(resolveGeneralLiveHref({ runtimeRoute: '#', manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(resolveGeneralLiveHref({ runtimeRoute: '/admin', manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(resolveGeneralLiveHref({ manifest: { generalLive: { available: true } } }), null);
  assert.equal(
    resolveGeneralLiveHref({
      manifest: { generalLive: { available: false, route: CANONICAL_GENERAL_LIVE_ROUTE } },
    }),
    null
  );
});
