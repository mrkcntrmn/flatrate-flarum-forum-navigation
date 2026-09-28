export const SETTING_ENABLED = 'flatrate-forum-navigation.quick_rail_enabled';
export const SETTING_USER_CONTROL_ENABLED = 'flatrate-forum-navigation.quick_rail_user_control_enabled';
export const SETTING_MEMBER_DEFAULT_VISIBLE = 'flatrate-forum-navigation.quick_rail_member_default_visible';
export const PREFERENCE_VISIBLE = 'flatrateForumNavigationQuickRailVisible';

export const FORUM_ATTR_ENABLED = 'flatrateQuickRailEnabled';
export const FORUM_ATTR_USER_CONTROL_ENABLED = 'flatrateQuickRailUserControlEnabled';
export const FORUM_ATTR_MEMBER_DEFAULT_VISIBLE = 'flatrateQuickRailMemberDefaultVisible';

export const MEMBER_QUICK_RAIL_ORDER = Object.freeze([
  'profile',
  'messages',
  'new_discussion',
  'technician_topics',
  'main',
]);

export function normalizeSettingBool(value, missingDefault) {
  if (value === undefined || value === null || value === '') {
    return !!missingDefault;
  }

  const explicit = normalizeExplicitPreference(value);
  return explicit === null ? !!missingDefault : explicit;
}

export function normalizeExplicitPreference(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '' || normalized === 'null') return null;
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
    return null;
  }

  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;

  return null;
}

export function getQuickRailAdminConfig(forum) {
  return {
    enabled: readForumBool(forum, FORUM_ATTR_ENABLED, false),
    userControlEnabled: readForumBool(forum, FORUM_ATTR_USER_CONTROL_ENABLED, true),
    memberDefaultVisible: readForumBool(forum, FORUM_ATTR_MEMBER_DEFAULT_VISIBLE, true),
  };
}

export function getExplicitQuickRailPreference(user) {
  if (!user || typeof user.preferences !== 'function') {
    return null;
  }

  const preferences = user.preferences();
  if (!preferences || typeof preferences !== 'object') {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(preferences, PREFERENCE_VISIBLE)) {
    return null;
  }

  return normalizeExplicitPreference(preferences[PREFERENCE_VISIBLE]);
}

export function effectiveMemberQuickRailVisible({ forum, user }) {
  const config = getQuickRailAdminConfig(forum);

  if (!config.enabled) {
    return false;
  }

  if (!config.userControlEnabled) {
    return config.memberDefaultVisible;
  }

  const explicit = getExplicitQuickRailPreference(user);
  if (explicit === true || explicit === false) {
    return explicit;
  }

  return config.memberDefaultVisible;
}

export function shouldShowQuickRailPreferenceControl(config) {
  return !!(config && config.enabled === true && config.userControlEnabled === true);
}

export function displayedQuickRailPreference({ explicit, memberDefaultVisible }) {
  if (explicit === true || explicit === false) {
    return explicit;
  }

  return !!memberDefaultVisible;
}

export function snapshotQuickRailPreference(user) {
  const preferences = user && typeof user.preferences === 'function' ? user.preferences() : null;
  if (!preferences || typeof preferences !== 'object') {
    return { present: false, value: null };
  }

  if (!Object.prototype.hasOwnProperty.call(preferences, PREFERENCE_VISIBLE)) {
    return { present: false, value: null };
  }

  return { present: true, value: preferences[PREFERENCE_VISIBLE] };
}

export function restoreQuickRailPreference(user, snapshot) {
  if (!user || typeof user.preferences !== 'function' || !snapshot) {
    return;
  }

  const preferences = user.preferences();
  if (!preferences || typeof preferences !== 'object') {
    return;
  }

  if (!snapshot.present) {
    delete preferences[PREFERENCE_VISIBLE];
    return;
  }

  preferences[PREFERENCE_VISIBLE] = snapshot.value;
}

export function quickRailControlIds({ signedIn, memberVisible }) {
  if (!signedIn) {
    return ['main'];
  }

  if (!memberVisible) {
    return [];
  }

  return MEMBER_QUICK_RAIL_ORDER.slice();
}

function readForumBool(forum, key, missingDefault) {
  if (!forum || typeof forum.attribute !== 'function') {
    return !!missingDefault;
  }

  return normalizeSettingBool(forum.attribute(key), missingDefault);
}
