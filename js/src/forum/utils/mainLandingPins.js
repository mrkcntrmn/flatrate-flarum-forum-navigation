/**
 * MAIN landing pin helpers (presentation configuration; not native Sticky).
 */

export const PUBLIC_MAIN_PINS_ATTR = 'flatratePublicMainPinnedDiscussionIds';
export const MEMBER_MAIN_PINS_ATTR = 'flatrateMemberMainPinnedDiscussionIds';

export function normalizePinnedIds(raw) {
  let value = raw;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return [];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const ids = [];

  for (const entry of value) {
    const id = Number(entry);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

export function mainPinIdsFromForum(forum, audience) {
  if (!forum || typeof forum.attribute !== 'function') {
    return [];
  }

  const attr = audience === 'public' ? PUBLIC_MAIN_PINS_ATTR : MEMBER_MAIN_PINS_ATTR;
  return normalizePinnedIds(forum.attribute(attr));
}

/**
 * Restore administrator order among API-visible discussion models.
 */
export function orderDiscussionsByConfiguredIds(discussions, configuredIds) {
  const byId = new Map();
  for (const discussion of discussions || []) {
    const id = Number(typeof discussion.id === 'function' ? discussion.id() : discussion.id);
    if (Number.isInteger(id) && id > 0) {
      byId.set(id, discussion);
    }
  }

  return (configuredIds || []).map((id) => byId.get(id)).filter(Boolean);
}

export function isCleanRootIndex({
  pathname = '/',
  routeName = '',
  searchParams = {},
  stickyParams = {},
  currentTag = null,
  page = 1,
} = {}) {
  const normalized = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (normalized !== '/') return false;
  if (currentTag) return false;
  if (searchParams.q || stickyParams.q) return false;
  if (searchParams.tags || stickyParams.tags) return false;
  if (searchParams.onFollowing === true || stickyParams.onFollowing === true) return false;
  if (routeName === 'following' || routeName === 'tag') return false;
  if (Number(page) > 1) return false;
  return true;
}
