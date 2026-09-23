import { hasSearchQuery, isRootDiscussionPath } from './defaultRootSort.js';

/** ItemList key for the HOME START board pin. */
export const START_BOARD_PIN_ITEM = 'flatrateStartBoardPin';

/**
 * Above IndexPage toolbar (100) and discussionList (90) on Flarum 1.8.19.
 */
export const START_BOARD_PIN_PRIORITY = 110;

const BLOCKED_ROUTE_NAMES = new Set([
  'following',
  'discussion',
  'user',
  'settings',
  'tags',
  'tag',
]);

/**
 * Pure visibility contract for the START board pin on the HOME feed.
 *
 * Shown only on the canonical root All Discussions index. Sort and pagination
 * do not suppress the pin. Search, Following, tag boards, and other contexts do.
 */
export function shouldShowStartBoardPin({
  pathname = '/',
  routeName = '',
  searchParams = {},
  stickyParams = {},
  currentTag = null,
} = {}) {
  if (!isRootDiscussionPath(pathname)) {
    return false;
  }

  if (hasSearchQuery(searchParams) || hasSearchQuery(stickyParams)) {
    return false;
  }

  if (routeName === 'following' || searchParams.onFollowing === true || stickyParams.onFollowing === true) {
    return false;
  }

  if (currentTag) {
    return false;
  }

  if (searchParams.tags || stickyParams.tags) {
    return false;
  }

  if (routeName && BLOCKED_ROUTE_NAMES.has(routeName)) {
    return false;
  }

  return true;
}

/**
 * Ensure exactly one START board pin ItemList entry.
 * Safe to call on redraw; never mutates app.discussions.
 */
export function addStartBoardPinItem(items, pinVnode) {
  if (!items || typeof items.add !== 'function') {
    return items;
  }

  if (items.items && items.items[START_BOARD_PIN_ITEM] && typeof items.remove === 'function') {
    items.remove(START_BOARD_PIN_ITEM);
  }

  items.add(START_BOARD_PIN_ITEM, pinVnode, START_BOARD_PIN_PRIORITY);
  return items;
}

export function removeStartBoardPinItem(items) {
  if (!items || typeof items.remove !== 'function') {
    return items;
  }

  if (items.items && items.items[START_BOARD_PIN_ITEM]) {
    items.remove(START_BOARD_PIN_ITEM);
  }

  return items;
}
