/**
 * Canonical discussion route generator for Help a Tech.
 *
 * Uses Flarum's native route helper app.route.discussion(discussion)
 * with robust fallback without external redirects, tracking parameters,
 * or non-canonical route hacks.
 */

export function discussionCanonicalHref(discussion, appInstance = null) {
  if (!discussion) return '/';

  const app =
    appInstance ||
    (typeof globalThis !== 'undefined' && globalThis.app) ||
    (typeof window !== 'undefined' && window.app) ||
    null;

  // 1. Prefer native Flarum route helper app.route.discussion(discussion)
  if (app && app.route && typeof app.route.discussion === 'function') {
    try {
      const url = app.route.discussion(discussion);
      if (url && typeof url === 'string') return url;
    } catch (_) {
      // Fall through to route lookup or path construction
    }
  }

  // 2. Named route lookup via app.route('discussion', { id: ... })
  if (app && typeof app.route === 'function' && app.routes && app.routes.discussion) {
    try {
      const slug = typeof discussion.slug === 'function' ? discussion.slug() : discussion.slug;
      const id = typeof discussion.id === 'function' ? discussion.id() : discussion.id;
      const url = app.route('discussion', { id: slug || id });
      if (url && typeof url === 'string') return url;
    } catch (_) {
      // Fall through
    }
  }

  // 3. Fallback canonical path construction (/d/{id}-{slug})
  const id = typeof discussion.id === 'function' ? discussion.id() : discussion.id;
  if (!id) return '/';

  const slug = typeof discussion.slug === 'function' ? discussion.slug() : discussion.slug;
  return `/d/${id}${slug ? '-' + slug : ''}`;
}
