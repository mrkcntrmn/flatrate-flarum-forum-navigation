function tagSlug(tag) {
  if (!tag) return '';
  const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
  return slug ? String(slug) : '';
}

/**
 * Index-board slug for structural Back to MAIN.
 * Canonical Flarum Tags 1.8.19 seam is app.currentTag(), then the route
 * param, then sticky search params. Fail closed when none resolve.
 */
export function resolveIndexBoardSlug({
  isIndexPage = false,
  isDiscussionPage = false,
  currentTag = null,
  routeTagParam = '',
  stickyTags = '',
} = {}) {
  if (!isIndexPage || isDiscussionPage) return '';

  const fromTag = tagSlug(currentTag);
  if (fromTag) return fromTag;

  if (routeTagParam) return String(routeTagParam);

  return stickyTags ? String(stickyTags) : '';
}
