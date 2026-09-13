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
const communitySrc = readFileSync(join(root, 'js/src/forum/components/CommunityPage.js'), 'utf8');

test('embedded manifest exposes exact General Live metadata', () => {
  assert.equal(manifest.community.generalLiveAvailable, true);
  assert.equal(manifest.community.generalLive.roomKey, 'community-general-live');
  assert.equal(manifest.community.generalLive.route, CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(manifest.community.startHere.slug, 'start-here');
  assert.equal(Object.prototype.hasOwnProperty.call(manifest.groups[0], 'boards'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest.groups[1], 'boards'), false);
});

test('Community page consumes manifest route and never hashes', () => {
  assert.match(communitySrc, /resolveGeneralLiveHref/);
  assert.match(communitySrc, /Open Start Here/);
  assert.match(communitySrc, /Open General Live/);
  assert.doesNotMatch(communitySrc, /Coming soon/);
  assert.doesNotMatch(communitySrc, /\|\| '#'/);
  assert.doesNotMatch(communitySrc, /href=\{'#'\}/);
});

test('live href prefers valid runtime override, else manifest, never #', () => {
  assert.equal(resolveGeneralLiveHref({ manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(
    resolveGeneralLiveHref({ runtimeRoute: '/live/other-room', manifest }),
    '/live/other-room'
  );
  assert.equal(resolveGeneralLiveHref({ runtimeRoute: '#', manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(resolveGeneralLiveHref({ runtimeRoute: '/admin', manifest }), CANONICAL_GENERAL_LIVE_ROUTE);
  assert.equal(resolveGeneralLiveHref({ manifest: { community: { generalLiveAvailable: true } } }), null);
  assert.equal(
    resolveGeneralLiveHref({
      manifest: { community: { generalLiveAvailable: false, generalLive: { route: CANONICAL_GENERAL_LIVE_ROUTE } } },
    }),
    null
  );
});
