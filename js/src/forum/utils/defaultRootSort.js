export const DEFAULT_ROOT_SORT = 'top';

export function isRootDiscussionPath(pathname) {
  const normalized = String(pathname || '/').replace(/\/+$/, '') || '/';
  return normalized === '/';
}

export function hasSearchQuery(params = {}) {
  const query = params.q;
  return typeof query === 'string' ? query.trim() !== '' : Boolean(query);
}

export function withDefaultRootSort(params = {}, pathname = '/') {
  if (!isRootDiscussionPath(pathname) || hasSearchQuery(params) || params.sort) {
    return params;
  }

  return { ...params, sort: DEFAULT_ROOT_SORT };
}

export function withRootSortOrder(sortMap = {}, params = {}, pathname = '/') {
  if (!isRootDiscussionPath(pathname) || hasSearchQuery(params) || !sortMap[DEFAULT_ROOT_SORT]) {
    return sortMap;
  }

  const { [DEFAULT_ROOT_SORT]: top, ...rest } = sortMap;
  return { [DEFAULT_ROOT_SORT]: top, ...rest };
}
