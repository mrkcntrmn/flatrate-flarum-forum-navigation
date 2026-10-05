/**
 * Canonical boardKey -> board URL.
 * Navigation owns this map. Messaging must not hardcode slug exceptions.
 */

import { flattenBrandBoards } from './discussionBrandTitle.js';

export function hrefForBoardKey(boardKey, { manifest = null, routeTag = null } = {}) {
  const key = typeof boardKey === 'string' ? boardKey : '';
  if (!key || !manifest) return null;

  const match = flattenBrandBoards(manifest).find(({ board }) => board?.boardKey === key);
  const slug = match?.board?.slug;
  if (!slug) return null;

  try {
    const href = typeof routeTag === 'function' ? routeTag(slug) : `/t/${slug}`;
    if (typeof href === 'string' && href.startsWith('/t/')) return href;
  } catch (error) {
    return null;
  }

  return null;
}
