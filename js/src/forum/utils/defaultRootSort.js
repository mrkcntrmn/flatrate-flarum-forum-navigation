/**
 * Root sort helpers. Authenticated MAIN uses Flarum's native Latest default.
 * These helpers intentionally no longer inject sort=top.
 */

export function isRootDiscussionPath(pathname) {
  const normalized = String(pathname || '/').replace(/\/+$/, '') || '/';
  return normalized === '/';
}

export function hasSearchQuery(params = {}) {
  const query = params.q;
  return typeof query === 'string' ? query.trim() !== '' : Boolean(query);
}

/** @deprecated Retained for import stability; no longer forces a root sort. */
export const DEFAULT_ROOT_SORT = null;

export function withDefaultRootSort(params = {}, pathname = '/') {
  return params;
}

export function withRootSortOrder(sortMap = {}, params = {}, pathname = '/') {
  return sortMap;
}
