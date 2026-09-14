/**
 * Narrow presentation-title resolver for the IndexPage App-titleControl.
 *
 * Flarum 1.8.19 SelectDropdown.getButtonContent() uses the first active child
 * label, else defaultLabel. On `/` the active All Discussions child therefore
 * wins over defaultLabel="Pick a Brand". Return a string to override that
 * label, or null to leave core SelectDropdown behavior unchanged.
 */

import { START_NAV_LABEL } from './startNav.js';

export const TECHNICIAN_TOPICS_SLUG = 'general-shop-discussion';
export const START_HERE_SLUG = 'start-here';
export const PICK_A_BRAND = 'Pick a Brand';
export const TECHNICIAN_TOPICS_LABEL = 'Technician Topics';
export const START_HERE_LABEL = START_NAV_LABEL;
export const PUSH_TO_START_LABEL = START_NAV_LABEL;

function tagSlug(currentTag) {
  if (!currentTag) return '';
  if (typeof currentTag.slug === 'function') return String(currentTag.slug() || '');
  return String(currentTag.slug || '');
}

function hasSearchQuery(searchContext) {
  if (!searchContext || typeof searchContext !== 'object') return false;
  const q = searchContext.q ?? searchContext.query;
  return typeof q === 'string' && q.trim() !== '';
}

function isFollowingContext({ activeCoreContext, routeName, searchContext }) {
  if (activeCoreContext === 'following') return true;
  if (routeName === 'following') return true;
  return !!(searchContext && searchContext.onFollowing === true);
}

function isCanonicalUnfilteredIndex({ currentTag, routeName, searchContext, routeContext }) {
  if (currentTag) return false;
  if (hasSearchQuery(searchContext)) return false;
  if (routeContext && routeContext.tags) return false;
  const params = searchContext || {};
  if (params.tags) return false;
  if (routeName && routeName !== 'index' && routeName !== 'default') return false;
  return true;
}

/**
 * @returns {string|null} presentation title, or null for core SelectDropdown
 */
export function resolvePresentationTitle({
  currentTag = null,
  routeName = '',
  routeContext = {},
  searchContext = {},
  activeCoreContext = '',
  manifest = null,
} = {}) {
  if (isFollowingContext({ activeCoreContext, routeName, searchContext })) {
    return null;
  }

  if (hasSearchQuery(searchContext)) {
    return null;
  }

  const slug =
    tagSlug(currentTag) ||
    (searchContext && searchContext.tags) ||
    (routeContext && routeContext.tags) ||
    '';
  if (slug) {
    if (slug === TECHNICIAN_TOPICS_SLUG) return TECHNICIAN_TOPICS_LABEL;
    if (slug === START_HERE_SLUG) return PICK_A_BRAND;
    return PICK_A_BRAND;
  }

  if (isCanonicalUnfilteredIndex({ currentTag, routeName, searchContext, routeContext })) {
    return PICK_A_BRAND;
  }

  return null;
}
