#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { badgeText, planePresentation, shouldShowMainNotifications } from '../src/forum/utils/mainNotifications.js';

const main = {
  signedIn: true,
  isIndexPage: true,
  isDiscussionPage: false,
  pathname: '/',
  routeName: 'index',
  searchParams: {},
  stickyParams: {},
  currentTag: null,
  page: 1,
};

test('signed-in MAIN shows the plane and guests do not', () => {
  assert.equal(shouldShowMainNotifications(main), true);
  assert.equal(shouldShowMainNotifications({ ...main, signedIn: false }), false);
});

test('brand, technician, start, following, discussion, messages, and notifications stay clear', () => {
  assert.equal(shouldShowMainNotifications({ ...main, currentTag: { slug: () => 'gm' } }), false);
  assert.equal(shouldShowMainNotifications({ ...main, currentTag: { slug: 'general-shop-discussion' } }), false);
  assert.equal(shouldShowMainNotifications({ ...main, currentTag: { slug: 'start-here' } }), false);
  assert.equal(shouldShowMainNotifications({ ...main, routeName: 'following' }), false);
  assert.equal(shouldShowMainNotifications({ ...main, isDiscussionPage: true }), false);
  assert.equal(shouldShowMainNotifications({ ...main, isIndexPage: false }), false);
  assert.equal(shouldShowMainNotifications({ ...main, isMessagesRoute: true }), false);
  assert.equal(shouldShowMainNotifications({ ...main, isNotificationsRoute: true }), false);
  assert.equal(shouldShowMainNotifications({ ...main, pathname: '/d/1-topic' }), false);
});

test('idle is white, unread is lime with a pink badge, and unknown is not zero', () => {
  const idle = planePresentation({ status: 'known', count: 0 });
  assert.equal(idle.color, '#ffffff');
  assert.equal(idle.badgeText, null);
  const unread = planePresentation({ status: 'known', count: 4 });
  assert.equal(unread.color, '#84cc16');
  assert.equal(unread.badgeBackground, '#c72d5d');
  assert.equal(unread.badgeColor, '#ffffff');
  assert.equal(unread.badgeText, '4');
  assert.equal(unread.ariaLabel, 'Notifications, 4 unread');
  const unknown = planePresentation({ status: 'unknown', count: null });
  assert.equal(unknown.color, '#ffffff');
  assert.equal(unknown.badgeText, null);
  assert.equal(unknown.ariaLabel, 'Notifications');
  assert.equal(planePresentation(null).badgeText, null);
});

test('badge caps the visual count at 99+ and keeps the exact accessible count', () => {
  assert.equal(badgeText(99), '99');
  assert.equal(badgeText(100), '99+');
  assert.equal(planePresentation({ status: 'known', count: 127 }).badgeText, '99+');
  assert.equal(planePresentation({ status: 'known', count: 127 }).ariaLabel, 'Notifications, 127 unread');
});
