const SETTING_V2_ADMIN_VISIBLE = 'flatrate-forum-navigation.center_menu_v2_admin_visible';
const SETTING_V2_USER_VISIBLE = 'flatrate-forum-navigation.center_menu_v2_user_visible';

const FORUM_ATTR_V2_ADMIN_VISIBLE = 'flatrateCenterMenuV2AdminVisible';
const FORUM_ATTR_V2_USER_VISIBLE = 'flatrateCenterMenuV2UserVisible';

const CENTER_MENU_V1 = 'v1';
const CENTER_MENU_V2 = 'v2';

const MEMBER_QUICK_RAIL_ORDER = Object.freeze([
  'profile',
  'messages',
  'new_discussion',
  'technician_topics',
  'main',
]);

function normalizeSettingBool(value, missingDefault) {
  if (value === undefined || value === null || value === '') {
    return !!missingDefault;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
    return !!missingDefault;
  }

  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;

  return !!missingDefault;
}

function getCenterMenuV2Config(forum) {
  return {
    adminVisible: readForumBool(forum, FORUM_ATTR_V2_ADMIN_VISIBLE, false),
    userVisible: readForumBool(forum, FORUM_ATTR_V2_USER_VISIBLE, false),
  };
}

function isAdminUser(user) {
  if (!user) return false;

  if (typeof user.isAdmin === 'function') {
    return !!user.isAdmin();
  }

  if (typeof user.attribute === 'function') {
    return !!user.attribute('isAdmin');
  }

  return false;
}

function centerMenuVersion({ forum, user }) {
  if (!user) {
    return CENTER_MENU_V1;
  }

  const config = getCenterMenuV2Config(forum);

  if (isAdminUser(user)) {
    return config.adminVisible ? CENTER_MENU_V2 : CENTER_MENU_V1;
  }

  return config.userVisible ? CENTER_MENU_V2 : CENTER_MENU_V1;
}

function centerMenuControlIds({ forum, user }) {
  if (centerMenuVersion({ forum, user }) === CENTER_MENU_V2) {
    return MEMBER_QUICK_RAIL_ORDER.slice();
  }

  return ['main'];
}

function readForumBool(forum, key, missingDefault) {
  if (!forum || typeof forum.attribute !== 'function') {
    return !!missingDefault;
  }

  return normalizeSettingBool(forum.attribute(key), missingDefault);
}

// Explicit export lists preserve numeric identifiers in flarum-webpack-config 3.1.0.
export { SETTING_V2_ADMIN_VISIBLE, SETTING_V2_USER_VISIBLE, FORUM_ATTR_V2_ADMIN_VISIBLE, FORUM_ATTR_V2_USER_VISIBLE, CENTER_MENU_V1, CENTER_MENU_V2, MEMBER_QUICK_RAIL_ORDER, normalizeSettingBool, getCenterMenuV2Config, isAdminUser, centerMenuVersion, centerMenuControlIds };
