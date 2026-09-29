#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  MEMBER_QUICK_RAIL_ORDER,
  PREFERENCE_VISIBLE,
  displayedQuickRailPreference,
  effectiveMemberQuickRailVisible,
  getExplicitQuickRailPreference,
  quickRailControlIds,
  restoreQuickRailPreference,
  shouldShowQuickRailPreferenceControl,
  snapshotQuickRailPreference,
} from '../src/forum/utils/quickRailVisibility.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const rail = read('js/src/forum/components/CenterQuickRail.js');
const visibility = read('js/src/forum/utils/quickRailVisibility.js');
const settingsPage = read('js/src/forum/quickRailSettingsPage.js');
const preferenceControl = read('js/src/forum/components/QuickRailPreferenceControl.js');
const indexSrc = read('js/src/forum/index.js');
const discussionSrc = read('js/src/forum/discussionCenterMenu.js');
const composer = read('js/src/forum/utils/openCanonicalNewDiscussion.js');
const admin = read('js/src/admin/components/QuickRailSettings.js');
const less = read('resources/less/forum.less');
const locale = read('resources/locale/en.yml');
const ci = read('.github/workflows/ci.yml');
const phpGate = read('src/QuickRailGate.php');

function forum(attrs) {
  return {
    attribute(key) {
      return attrs[key];
    },
  };
}

function userWith(preference, { present = true } = {}) {
  const preferences = {};
  if (present) preferences[PREFERENCE_VISIBLE] = preference;
  return {
    preferences() {
      return preferences;
    },
    savePreferences(next) {
      Object.assign(preferences, next);
      return Promise.resolve(this);
    },
  };
}

test('member quick rail order is profile, messages, new discussion, technician topics, main', () => {
  assert.deepEqual(MEMBER_QUICK_RAIL_ORDER, [
    'profile',
    'messages',
    'new_discussion',
    'technician_topics',
    'main',
  ]);
  assert.deepEqual(quickRailControlIds({ signedIn: true, memberVisible: true }), [
    'profile',
    'messages',
    'new_discussion',
    'technician_topics',
    'main',
  ]);
  assert.match(rail, /quickRailControlIds/);
  assert.match(rail, /data-quick-rail-control="profile"/);
  assert.match(rail, /data-quick-rail-control="messages"/);
  assert.match(rail, /data-quick-rail-control="new_discussion"/);
  assert.match(rail, /data-quick-rail-control="technician_topics"/);
  assert.match(rail, /data-quick-rail-control="main"/);
  assert.doesNotMatch(rail, /following/i);
  assert.doesNotMatch(rail, /fa-star/);
  assert.doesNotMatch(rail, /fa-play-circle/);
  assert.doesNotMatch(rail, /START/);
  assert.doesNotMatch(rail, /localStorage/);
  assert.doesNotMatch(rail, /flatRateBrandUpvotes/);
});

test('guest quick rail is MAIN only and opted-out members render no wrapper', () => {
  assert.deepEqual(quickRailControlIds({ signedIn: false, memberVisible: true }), ['main']);
  assert.deepEqual(quickRailControlIds({ signedIn: false, memberVisible: false }), ['main']);
  assert.deepEqual(quickRailControlIds({ signedIn: true, memberVisible: false }), []);
  assert.match(rail, /if \(!ids\.length\)/);
  assert.match(rail, /return null/);
  assert.match(rail, /static isListItem = true/);
  assert.match(rail, /fas fa-warehouse/);
  assert.match(rail, /fas fa-paper-plane/);
  assert.match(rail, /app\.route\.user\(user\)/);
  assert.match(rail, /avatar\(user/);
  assert.doesNotMatch(rail, /MessagesNavButton/);
});

test('effective member visibility truth table', () => {
  const cases = [
    [{ enabled: false, userControl: true, memberDefault: true, pref: undefined }, false],
    [{ enabled: false, userControl: true, memberDefault: true, pref: true }, false],
    [{ enabled: false, userControl: true, memberDefault: true, pref: false }, false],
    [{ enabled: true, userControl: true, memberDefault: true, pref: undefined }, true],
    [{ enabled: true, userControl: true, memberDefault: false, pref: undefined }, false],
    [{ enabled: true, userControl: true, memberDefault: false, pref: true }, true],
    [{ enabled: true, userControl: true, memberDefault: true, pref: false }, false],
    [{ enabled: true, userControl: false, memberDefault: false, pref: true }, false],
    [{ enabled: true, userControl: false, memberDefault: true, pref: false }, true],
    [{ enabled: true, userControl: false, memberDefault: true, pref: undefined }, true],
  ];

  for (const [input, expected] of cases) {
    const present = input.pref !== undefined;
    const result = effectiveMemberQuickRailVisible({
      forum: forum({
        flatrateQuickRailEnabled: input.enabled,
        flatrateQuickRailUserControlEnabled: input.userControl,
        flatrateQuickRailMemberDefaultVisible: input.memberDefault,
      }),
      user: userWith(input.pref, { present }),
    });
    assert.equal(result, expected, JSON.stringify(input));
  }
});

test('null preference is distinct from false and string false is not truthy', () => {
  assert.equal(getExplicitQuickRailPreference(userWith(null)), null);
  assert.equal(getExplicitQuickRailPreference(userWith(false)), false);
  assert.equal(getExplicitQuickRailPreference(userWith('false')), false);
  assert.equal(getExplicitQuickRailPreference(userWith(undefined, { present: false })), null);
  assert.equal(displayedQuickRailPreference({ explicit: null, memberDefaultVisible: true }), true);
  assert.equal(displayedQuickRailPreference({ explicit: false, memberDefaultVisible: true }), false);
  assert.equal(displayedQuickRailPreference({ explicit: true, memberDefaultVisible: false }), true);
});

test('hidden settings control does not clear preference and failed save restores it', async () => {
  assert.equal(shouldShowQuickRailPreferenceControl({ enabled: false, userControlEnabled: true }), false);
  assert.equal(shouldShowQuickRailPreferenceControl({ enabled: true, userControlEnabled: false }), false);
  assert.equal(shouldShowQuickRailPreferenceControl({ enabled: true, userControlEnabled: true }), true);
  assert.doesNotMatch(settingsPage, /savePreferences/);
  assert.match(settingsPage, /shouldShowQuickRailPreferenceControl/);
  assert.match(preferenceControl, /savePreferences/);
  assert.match(preferenceControl, /restoreQuickRailPreference/);
  assert.match(preferenceControl, /\.catch/);

  const user = userWith(false);
  const snapshot = snapshotQuickRailPreference(user);
  await user.savePreferences({ [PREFERENCE_VISIBLE]: true });
  assert.equal(getExplicitQuickRailPreference(user), true);
  restoreQuickRailPreference(user, snapshot);
  assert.equal(getExplicitQuickRailPreference(user), false);

  const unset = userWith(null, { present: false });
  const unsetSnapshot = snapshotQuickRailPreference(unset);
  await unset.savePreferences({ [PREFERENCE_VISIBLE]: false });
  restoreQuickRailPreference(unset, unsetSnapshot);
  assert.equal(getExplicitQuickRailPreference(unset), null);
});

test('admin and user-control toggles do not rewrite an explicit preference', () => {
  const member = userWith(false);
  const off = effectiveMemberQuickRailVisible({
    forum: forum({
      flatrateQuickRailEnabled: false,
      flatrateQuickRailUserControlEnabled: true,
      flatrateQuickRailMemberDefaultVisible: true,
    }),
    user: member,
  });
  const on = effectiveMemberQuickRailVisible({
    forum: forum({
      flatrateQuickRailEnabled: true,
      flatrateQuickRailUserControlEnabled: true,
      flatrateQuickRailMemberDefaultVisible: true,
    }),
    user: member,
  });
  assert.equal(off, false);
  assert.equal(on, false);
  assert.equal(getExplicitQuickRailPreference(member), false);

  const shown = userWith(true);
  const forced = effectiveMemberQuickRailVisible({
    forum: forum({
      flatrateQuickRailEnabled: true,
      flatrateQuickRailUserControlEnabled: false,
      flatrateQuickRailMemberDefaultVisible: false,
    }),
    user: shown,
  });
  const restored = effectiveMemberQuickRailVisible({
    forum: forum({
      flatrateQuickRailEnabled: true,
      flatrateQuickRailUserControlEnabled: true,
      flatrateQuickRailMemberDefaultVisible: false,
    }),
    user: shown,
  });
  assert.equal(forced, false);
  assert.equal(restored, true);
  assert.equal(getExplicitQuickRailPreference(shown), true);
  assert.doesNotMatch(visibility, /localStorage/);
  assert.equal((visibility.match(/function effectiveMemberQuickRailVisible/g) || []).length, 1);
});

test('IndexPage and DiscussionPage share CenterQuickRail and the canonical composer seam', () => {
  assert.match(indexSrc, /<CenterQuickRail manifest=\{manifest\} page=\{this\} \/>/);
  assert.match(discussionSrc, /<CenterQuickRail manifest=\{manifest\} page=\{this\} \/>/);
  assert.match(indexSrc, /'flatrateQuickRail'/);
  assert.match(discussionSrc, /'flatrateQuickRail'/);
  assert.doesNotMatch(indexSrc, /function effectiveMemberQuickRailVisible/);
  assert.doesNotMatch(discussionSrc, /function effectiveMemberQuickRailVisible/);
  assert.match(composer, /IndexPage\.prototype\.newDiscussionAction\.call/);
  assert.match(composer, /currentTag/);
  assert.doesNotMatch(composer, /DiscussionComposer/);
  assert.doesNotMatch(composer, /new DiscussionComposer/);
  assert.match(rail, /openCanonicalNewDiscussion/);
  assert.match(rail, /closeCenterSheetFrom/);
});

test('admin settings use canonical keys and do not touch member preferences', () => {
  assert.match(admin, /SETTING_ENABLED/);
  assert.match(admin, /SETTING_USER_CONTROL_ENABLED/);
  assert.match(admin, /SETTING_MEMBER_DEFAULT_VISIBLE/);
  assert.match(admin, /\/settings/);
  assert.doesNotMatch(admin, /savePreferences/);
  assert.doesNotMatch(admin, /PREFERENCE_VISIBLE/);
  assert.match(phpGate, /flatrate-forum-navigation\.quick_rail_enabled/);
  assert.match(locale, /admin:\n {4}quick_rail:/);
  assert.match(locale, /enabled_label:/);
  assert.match(locale, /user_control_label:/);
  assert.match(locale, /member_default_label:/);
  assert.match(locale, /quick_rail_label: Show quick navigation in the forum menu/);
  assert.match(locale, /quick_rail_save_error:/);
});

test('phone sheet stays below the header, half-screen, scrollable, and full-width', () => {
  assert.match(less, /\.item-flatrateQuickRail[\s\S]*position:\s*sticky/);
  assert.match(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[\s\S]*position:\s*absolute !important/
  );
  assert.match(less, /top:\s*100% !important/);
  assert.match(less, /bottom:\s*auto !important/);
  assert.match(less, /left:\s*~"calc\(50% - 50vw\)" !important/);
  assert.match(less, /width:\s*100vw !important/);
  assert.match(less, /max-height:\s*50dvh/);
  assert.match(less, /overflow-y:\s*auto/);
  assert.match(less, /overflow-x:\s*hidden/);
  assert.doesNotMatch(less, /max-height:\s*calc\(100dvh/);
  assert.match(less, /safe-area-inset-bottom/);
  assert.match(less, /min-width:\s*44px/);
  assert.match(less, /min-height:\s*44px/);
  assert.match(less, /:focus-visible/);
  assert.match(less, /\.FlatRateCenterQuickRail--guest[\s\S]*justify-content:\s*center/);
  assert.match(less, /justify-content:\s*space-evenly/);
  assert.match(less, /\.Dropdown-menu > \.item-allDiscussions[\s\S]*display:\s*none !important/);
  assert.match(less, /@media \(min-width: 768px\)[\s\S]*\.FlatRateCenterQuickRail/);
  assert.match(less, /min-width:\s*320px\) and \(max-width:\s*430px\)/);
  assert.match(less, /360/);
  assert.match(less, /390/);
  assert.match(less, /412/);
  for (const width of [320, 360, 390, 412, 430]) {
    assert.ok(width >= 320 && width <= 430);
  }
});

test('tracked admin dist is part of the reproducibility gate', () => {
  assert.match(ci, /js\/dist\/admin\.js js\/dist\/admin\.js\.map/);
  assert.match(ci, /js\/dist\/forum\.js js\/dist\/forum\.js\.map/);
});
