/**
 * Brand-board Live pin visibility. Presentation only.
 * The row is not a Discussion and does not follow discussion sort or search.
 */

import { findBrandNodeBySlug } from './brandNode.js';

export const BRAND_LIVE_ITEM = 'flatrateBrandLive';
export const BRAND_LIVE_PRIORITY = 115;

export function currentBrandBoard({ currentTag = null, manifest = null } = {}) {
  if (!currentTag || !manifest) return null;
  const slug = typeof currentTag.slug === 'function' ? currentTag.slug() : currentTag.slug;
  const board = findBrandNodeBySlug(manifest, slug);
  if (!board?.boardKey || !board?.slug) return null;
  return board;
}

export function shouldShowBrandLive({
  signedIn = false,
  routeName = '',
  searchParams = {},
  stickyParams = {},
  currentTag = null,
  page = 1,
  manifest = null,
  provider = null,
} = {}) {
  if (!signedIn) return false;
  if (Number(page) > 1) return false;
  if (routeName === 'following') return false;
  if (searchParams?.q || stickyParams?.q) return false;
  const board = currentBrandBoard({ currentTag, manifest });
  if (!board) return false;
  if (!provider || typeof provider.available !== 'function') return false;
  try {
    return provider.available(board.boardKey) === true;
  } catch (error) {
    return false;
  }
}

export function getLiveBoardProvider(appLike) {
  try {
    return appLike && appLike.flatRateLiveBoard ? appLike.flatRateLiveBoard : null;
  } catch (error) {
    return null;
  }
}

export function addBrandLiveItem(items, vnode) {
  if (!items || typeof items.add !== 'function') return items;
  if (items.items && items.items[BRAND_LIVE_ITEM] && typeof items.remove === 'function') {
    items.remove(BRAND_LIVE_ITEM);
  }
  items.add(BRAND_LIVE_ITEM, vnode, BRAND_LIVE_PRIORITY);
  return items;
}

export function removeBrandLiveItem(items) {
  if (!items || typeof items.remove !== 'function') return items;
  if (items.items && items.items[BRAND_LIVE_ITEM]) {
    items.remove(BRAND_LIVE_ITEM);
  }
  return items;
}
