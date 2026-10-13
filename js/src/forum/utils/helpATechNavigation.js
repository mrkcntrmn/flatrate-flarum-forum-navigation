/**
 * Canonical discussion route generator for Help a Tech.
 *
 * Generates canonical /d/{id}-{slug} URLs without external redirects,
 * tracking parameters, or non-canonical route hacks.
 */

export function discussionCanonicalHref(discussion) {
  if (!discussion) return '/';

  const id = typeof discussion.id === 'function' ? discussion.id() : discussion.id;
  if (!id) return '/';

  const slug = typeof discussion.slug === 'function' ? discussion.slug() : discussion.slug;
  return `/d/${id}${slug ? '-' + slug : ''}`;
}
