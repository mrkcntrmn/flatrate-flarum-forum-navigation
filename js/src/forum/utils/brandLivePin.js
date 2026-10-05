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

function tagSlugValue(tag) {
  if (!tag) return '';
  const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
  return slug ? String(slug) : '';
}

function lookupTagBySlug(store, slug) {
  if (!slug || !store || typeof store.all !== 'function') return null;
  try {
    const tags = store.all('tags') || [];
    return tags.find((tag) => tagSlugValue(tag) === slug) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Brand Live context only. Do not use this for MAIN or START.
 *
 * Production Flarum 1.8.19 stores route state on app.current, which has no
 * currentTag(). The IndexPage instance is the seam that does.
 *
 * Priority:
 *   1. IndexPage.currentTag()
 *   2. an already resolved tag
 *   3. tags slug from search or sticky params, via app.store
 *   4. null
 */
export function resolveBrandLiveTag({
  page = null,
  currentTag = null,
  searchParams = null,
  stickyParams = null,
  store = null,
} = {}) {
  if (page && typeof page.currentTag === 'function') {
    try {
      const fromPage = page.currentTag();
      if (fromPage) return fromPage;
    } catch (error) {
      // Fall through. A broken page method must not invent a board.
    }
  }

  if (currentTag) return currentTag;

  const slug = (searchParams && searchParams.tags) || (stickyParams && stickyParams.tags) || '';
  if (typeof slug !== 'string' || !slug) return null;
  return lookupTagBySlug(store, slug);
}

export function prepareBrandLiveMount({
  page = null,
  currentTag = null,
  searchParams = null,
  stickyParams = null,
  store = null,
  signedIn = false,
  routeName = '',
  pageNumber = 1,
  manifest = null,
  provider = null,
} = {}) {
  const tag = resolveBrandLiveTag({
    page,
    currentTag,
    searchParams,
    stickyParams,
    store,
  });
  const show = shouldShowBrandLive({
    signedIn,
    routeName,
    searchParams,
    stickyParams,
    currentTag: tag,
    page: pageNumber,
    manifest,
    provider,
  });
  return {
    tag,
    board: show ? currentBrandBoard({ currentTag: tag, manifest }) : null,
    show,
  };
}

export function activateBrandLive(board, provider) {
  if (!board?.boardKey || !provider || typeof provider.activate !== 'function') return;
  Promise.resolve(provider.activate(board.boardKey)).catch(() => {});
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
