#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { actorNotificationsAvailable, shouldShowMainNotifications } from '../src/forum/utils/mainNotifications.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const button = readFileSync(join(root, 'js/src/forum/components/MainNotificationsButton.js'), 'utf8');
const mount = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const helper = readFileSync(join(root, 'js/src/forum/utils/mainNotifications.js'), 'utf8');

test('guest MAIN does not mount a notifications control', () => {
  assert.equal(shouldShowMainNotifications({
    signedIn: false,
    notificationsAvailable: true,
    isIndexPage: true,
    pathname: '/',
    routeName: 'index',
    searchParams: {},
    stickyParams: {},
    currentTag: null,
    page: 1,
  }), false);
  assert.match(button, /if \(!actorNotificationsAvailable\(app\)\)/);
  assert.match(button, /return null/);
  assert.equal(actorNotificationsAvailable({ session: { user: null }, flatrateNotificationState: { available: true } }), false);
  assert.equal(actorNotificationsAvailable({ session: { user: { id: () => '6' } } }), false);
  assert.equal(actorNotificationsAvailable({
    session: { user: { id: () => '6' } },
    flatrateNotificationState: { available: false },
  }), false);
  assert.equal(actorNotificationsAvailable({
    session: { user: { id: () => '6' } },
    flatrateNotificationState: { available: true },
  }), true);
});

test('navigation consumes messaging-owned availability and not rollout settings', () => {
  const combined = `${button}\n${mount}\n${helper}`;
  assert.match(combined, /actorNotificationsAvailable/);
  assert.match(helper, /flatrateNotificationState/);
  assert.doesNotMatch(combined, /flatrate-messaging-ui\.notifications_available/);
  assert.doesNotMatch(combined, /BetaTesterProjection|isActive\(|notifications_member_|notifications_admin_preview|is_beta_tester|beta_tester_active/);
});
