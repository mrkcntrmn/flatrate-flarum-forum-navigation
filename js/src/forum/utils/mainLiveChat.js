/**
 * MAIN General Live synthetic row helpers.
 * Presentation only — consumes Live Chat provider; never creates a Discussion.
 */

import { isCleanRootIndex } from './mainLandingPins.js';

/** ItemList key for the locked MAIN Live row. */
export const MAIN_LIVE_CHAT_ITEM = 'flatrateMainLive';

/**
 * Above START (110), Member MAIN pins (105), toolbar (100), discussionList (90).
 */
export const MAIN_LIVE_CHAT_PRIORITY = 120;

/** Canonical Messages destination when provider href is unavailable. */
export const CANONICAL_MAIN_LIVE_HREF = '/messages/live/community-general-live';

export function getLiveMainProvider(appLike) {
  try {
    return appLike && appLike.flatRateLiveMain ? appLike.flatRateLiveMain : null;
  } catch (error) {
    return null;
  }
}

/**
 * Fail closed: missing provider, throw, or available() !== true => absent.
 */
export function isLiveMainProviderAvailable(provider) {
  if (!provider || typeof provider.available !== 'function') {
    return false;
  }

  try {
    return provider.available() === true;
  } catch (error) {
    return false;
  }
}

/**
 * Authenticated MAIN page 1 (including explicit root sorts) only.
 * Search / Following / tag / Brand / page 2+ / guest => hidden.
 */
export function shouldShowMainLiveChat({
  signedIn = false,
  pathname = '/',
  routeName = '',
  searchParams = {},
  stickyParams = {},
  currentTag = null,
  page = 1,
  provider = null,
} = {}) {
  if (!signedIn) {
    return false;
  }

  if (
    !isCleanRootIndex({
      pathname,
      routeName,
      searchParams,
      stickyParams,
      currentTag,
      page,
    })
  ) {
    return false;
  }

  return isLiveMainProviderAvailable(provider);
}

export function resolveMainLiveHref(provider) {
  try {
    if (provider && typeof provider.href === 'function') {
      const href = provider.href();
      if (typeof href === 'string' && href.indexOf('/messages/live/') === 0) {
        return href;
      }
    }
  } catch (error) {
    // fall through to canonical
  }

  return CANONICAL_MAIN_LIVE_HREF;
}

/**
 * Distinguish count unavailable (null) from valid zero.
 * unknown => "LIVE" (no invented zero)
 * 0 => "0 LIVE"
 * N => "N LIVE"
 */
export function formatLiveCountPresentation(count) {
  if (count === null || count === undefined) {
    return {
      text: 'LIVE',
      ariaLabel: 'Live presence count unavailable',
      known: false,
    };
  }

  const value = Number(count);
  if (!Number.isFinite(value) || value < 0) {
    return {
      text: 'LIVE',
      ariaLabel: 'Live presence count unavailable',
      known: false,
    };
  }

  const n = Math.floor(value);
  return {
    text: `${n} LIVE`,
    ariaLabel: `${n} members live`,
    known: true,
  };
}

export function readUserLive(provider) {
  if (!provider || typeof provider.userLive !== 'function') {
    return false;
  }
  try {
    return provider.userLive() === true;
  } catch (error) {
    return false;
  }
}

export function addMainLiveChatItem(items, pinVnode) {
  if (!items || typeof items.add !== 'function') {
    return items;
  }

  if (items.items && items.items[MAIN_LIVE_CHAT_ITEM] && typeof items.remove === 'function') {
    items.remove(MAIN_LIVE_CHAT_ITEM);
  }

  items.add(MAIN_LIVE_CHAT_ITEM, pinVnode, MAIN_LIVE_CHAT_PRIORITY);
  return items;
}

export function removeMainLiveChatItem(items) {
  if (!items || typeof items.remove !== 'function') {
    return items;
  }

  if (items.items && items.items[MAIN_LIVE_CHAT_ITEM]) {
    items.remove(MAIN_LIVE_CHAT_ITEM);
  }

  return items;
}
