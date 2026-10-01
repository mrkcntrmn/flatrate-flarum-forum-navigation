#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  CENTER_MENU_V1,
  CENTER_MENU_V2,
  MEMBER_QUICK_RAIL_ORDER,
  SETTING_V2_ADMIN_VISIBLE,
  SETTING_V2_USER_VISIBLE,
  centerMenuControlIds,
  centerMenuVersion,
  getCenterMenuV2Config,
} from '../src/forum/utils/quickRailVisibility.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const rail = read('js/src/forum/components/CenterQuickRail.js');
const visibility = read('js/src/forum/utils/quickRailVisibility.js');
const settingsPage = read('js/src/forum/quickRailSettingsPage.js');
const indexSrc = read('js/src/forum/index.js');
const discussionSrc = read('js/src/forum/discussionCenterMenu.js');
const composer = read('js/src/forum/utils/openCanonicalNewDiscussion.js');
const admin = read('js/src/admin/components/QuickRailSettings.js');
const extendPhp = read('extend.php');
const less = read('resources/less/forum.less');
const locale = read('resources/locale/en.yml');
const ci = read('.github/workflows/ci.yml');
const phpGate = read('src/QuickRailGate.php');

function forum(attrs = {}) {
  return {
    attribute(key) {
      return attrs[key];
    },
  };
}

function user({ admin = false } = {}) {
  return {
    isAdmin() {
      return admin;
    },
  };
}

test('V1 is MAIN-only and V2 keeps the exact five-action order', () => {
  assert.deepEqual(MEMBER_QUICK_RAIL_ORDER, [
    'profile',
    'messages',
    'new_discussion',
    'technician_topics',
    'main',
  ]);

  const off = forum({
    flatrateCenterMenuV2AdminVisible: false,
    flatrateCenterMenuV2UserVisible: false,
  });
  const userOn = forum({
    flatrateCenterMenuV2AdminVisible: false,
    flatrateCenterMenuV2UserVisible: true,
  });
  const adminOn = forum({
    flatrateCenterMenuV2AdminVisible: true,
    flatrateCenterMenuV2UserVisible: false,
  });

  assert.deepEqual(centerMenuControlIds({ forum: off, user: null }), ['main']);
  assert.deepEqual(centerMenuControlIds({ forum: off, user: user() }), ['main']);
  assert.deepEqual(centerMenuControlIds({ forum: off, user: user({ admin: true }) }), ['main']);
  assert.deepEqual(centerMenuControlIds({ forum: userOn, user: user() }), MEMBER_QUICK_RAIL_ORDER);
  assert.deepEqual(centerMenuControlIds({ forum: adminOn, user: user({ admin: true }) }), MEMBER_QUICK_RAIL_ORDER);

  assert.match(rail, /centerMenuControlIds/);
  assert.match(rail, /centerMenuVersion/);
  assert.match(rail, /data-center-menu-version=\{version\}/);
  assert.match(rail, /FlatRateCenterQuickRail--v1/);
  assert.match(rail, /FlatRateCenterQuickRail--v2/);
  assert.match(rail, /data-quick-rail-control="profile"/);
  assert.match(rail, /data-quick-rail-control="messages"/);
  assert.match(rail, /data-quick-rail-control="new_discussion"/);
  assert.match(rail, /data-quick-rail-control="technician_topics"/);
  assert.match(rail, /data-quick-rail-control="main"/);
  assert.match(rail, /fas fa-warehouse/);
  assert.doesNotMatch(rail, /if \(!ids\.length\)/);
  assert.doesNotMatch(rail, /return null/);
});

test('audience gate matrix keeps guests on V1 and admin/user gates independent', () => {
  for (const adminVisible of [false, true]) {
    for (const userVisible of [false, true]) {
      const f = forum({
        flatrateCenterMenuV2AdminVisible: adminVisible,
        flatrateCenterMenuV2UserVisible: userVisible,
      });

      assert.equal(centerMenuVersion({ forum: f, user: null }), CENTER_MENU_V1);
      assert.equal(
        centerMenuVersion({ forum: f, user: user() }),
        userVisible ? CENTER_MENU_V2 : CENTER_MENU_V1
      );
      assert.equal(
        centerMenuVersion({ forum: f, user: user({ admin: true }) }),
        adminVisible ? CENTER_MENU_V2 : CENTER_MENU_V1
      );
    }
  }
});

test('V2 settings default off and use only the independent audience gates', () => {
  assert.equal(SETTING_V2_ADMIN_VISIBLE, 'flatrate-forum-navigation.center_menu_v2_admin_visible');
  assert.equal(SETTING_V2_USER_VISIBLE, 'flatrate-forum-navigation.center_menu_v2_user_visible');

  assert.deepEqual(getCenterMenuV2Config(forum({})), {
    adminVisible: false,
    userVisible: false,
  });

  assert.match(admin, /SETTING_V2_ADMIN_VISIBLE/);
  assert.match(admin, /SETTING_V2_USER_VISIBLE/);
  assert.match(admin, /\/settings/);
  assert.doesNotMatch(admin, /SETTING_ENABLED/);
  assert.doesNotMatch(admin, /SETTING_USER_CONTROL_ENABLED/);
  assert.doesNotMatch(admin, /SETTING_MEMBER_DEFAULT_VISIBLE/);
  assert.doesNotMatch(admin, /savePreferences/);

  assert.match(phpGate, /center_menu_v2_admin_visible/);
  assert.match(phpGate, /center_menu_v2_user_visible/);
  assert.match(extendPhp, /SETTING_V2_ADMIN_VISIBLE, '0'/);
  assert.match(extendPhp, /SETTING_V2_USER_VISIBLE, '0'/);
  assert.doesNotMatch(extendPhp, /registerPreference/);

  assert.match(locale, /heading: Center Menu V2/);
  assert.match(locale, /admin_v2_label:/);
  assert.match(locale, /user_v2_label:/);
  assert.doesNotMatch(locale, /quick_rail_label: Show quick navigation/);

  assert.doesNotMatch(settingsPage, /SettingsPage/);
  assert.doesNotMatch(settingsPage, /savePreferences/);
  assert.match(settingsPage, /intentionally retired/);
  assert.doesNotMatch(visibility, /PREFERENCE_VISIBLE/);
  assert.doesNotMatch(visibility, /localStorage/);
});

test('IndexPage and DiscussionPage share CenterQuickRail and canonical actions', () => {
  assert.match(indexSrc, /<CenterQuickRail manifest=\{manifest\} page=\{this\} \/>/);
  assert.match(discussionSrc, /<CenterQuickRail manifest=\{manifest\} page=\{this\} \/>/);
  assert.match(indexSrc, /'flatrateQuickRail'/);
  assert.match(discussionSrc, /'flatrateQuickRail'/);
  assert.match(composer, /IndexPage\.prototype\.newDiscussionAction\.call/);
  assert.match(composer, /currentTag/);
  assert.doesNotMatch(composer, /DiscussionComposer/);
  assert.doesNotMatch(composer, /new DiscussionComposer/);
  assert.match(rail, /openCanonicalNewDiscussion/);
  assert.match(rail, /closeCenterSheetFrom/);
  assert.match(rail, /app\.route\.user\(user\)/);
  assert.match(rail, /fas fa-paper-plane/);
  assert.doesNotMatch(rail, /following/i);
  assert.doesNotMatch(rail, /fa-star/);
  assert.doesNotMatch(rail, /fa-play-circle/);
});

test('phone center sheet is viewport-fixed, 65dvh, scrollable, and full-width', () => {
  assert.match(less, /\.item-flatrateQuickRail[\s\S]*position:\s*sticky/);
  assert.match(
    less,
    /\.App-titleControl \.Dropdown-menu\s*\{[\s\S]*position:\s*fixed !important/
  );
  assert.match(less, /top:\s*auto !important/);
  assert.match(less, /bottom:\s*0 !important/);
  assert.match(less, /left:\s*0 !important/);
  assert.match(less, /right:\s*0 !important/);
  assert.match(less, /width:\s*100vw !important/);
  assert.match(less, /height:\s*65dvh/);
  assert.match(less, /max-height:\s*65dvh/);
  assert.match(less, /overflow-y:\s*auto/);
  assert.match(less, /overflow-x:\s*hidden/);
  assert.doesNotMatch(less, /height:\s*50dvh/);
  assert.doesNotMatch(less, /max-height:\s*50dvh/);
  assert.doesNotMatch(less, /transform: translateX\(-50%\) !important/);
  assert.match(less, /safe-area-inset-bottom/);
  assert.match(less, /min-width:\s*44px/);
  assert.match(less, /min-height:\s*44px/);
  assert.match(less, /:focus-visible/);
  assert.match(less, /\.FlatRateCenterQuickRail--v1[\s\S]*justify-content:\s*center/);
  assert.match(less, /justify-content:\s*space-evenly/);
  assert.match(less, /\.Dropdown-menu > \.item-allDiscussions[\s\S]*display:\s*none !important/);
  assert.match(less, /@media \(min-width: 768px\)[\s\S]*\.FlatRateCenterQuickRail/);
  assert.match(less, /min-width:\s*320px\) and \(max-width:\s*430px\)/);
});

test('tracked admin and forum dist stay inside the reproducibility gate', () => {
  assert.match(ci, /js\/dist\/admin\.js js\/dist\/admin\.js\.map/);
  assert.match(ci, /js\/dist\/forum\.js js\/dist\/forum\.js\.map/);
});
