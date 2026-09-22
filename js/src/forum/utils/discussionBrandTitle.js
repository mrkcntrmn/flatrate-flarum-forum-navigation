import { PICK_A_BRAND } from './presentationTitle.js';

function tagSlug(tag) {
  if (!tag) return '';
  if (typeof tag.slug === 'function') return String(tag.slug() || '');
  return String(tag.slug || '');
}

function discussionTags(discussion) {
  if (!discussion) return [];
  if (typeof discussion.tags === 'function') return discussion.tags() || [];
  return Array.isArray(discussion.tags) ? discussion.tags : [];
}

export function flattenBrandBoards(manifest) {
  const brandGroup = (manifest?.groups || []).find((group) => group?.mode === 'tree' && group?.id === 'brands');
  const flattened = [];

  function visit(board, depth) {
    if (!board) return;
    flattened.push({ board, depth });
    (board.children || []).forEach((child) => visit(child, depth + 1));
  }

  (brandGroup?.boards || []).forEach((board) => visit(board, 0));
  return flattened;
}

/**
 * Resolve the most specific Brand board attached to a discussion.
 * If both a parent brand and child marque are attached, prefer the deepest
 * matching board (for example Chevrolet over GM).
 */
export function resolveDiscussionBrandBoard({ discussion = null, manifest = null } = {}) {
  const slugs = new Set(discussionTags(discussion).map(tagSlug).filter(Boolean));
  if (!slugs.size) return null;

  const matches = flattenBrandBoards(manifest).filter(({ board }) => slugs.has(String(board?.slug || '')));
  if (!matches.length) return null;

  matches.sort((left, right) => right.depth - left.depth);
  return matches[0].board || null;
}

/**
 * Resolve the board label used by the mobile center control on a discussion.
 * Non-brand discussions use the generic FlatRate.wiki center-menu label.
 */
export function resolveDiscussionBrandTitle({ discussion = null, manifest = null } = {}) {
  const board = resolveDiscussionBrandBoard({ discussion, manifest });
  return String(board?.name || PICK_A_BRAND);
}
