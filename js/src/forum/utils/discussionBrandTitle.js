import { PICK_A_BRAND } from './presentationTitle.js';

export const TECHNICIAN_TOPICS_SLUG = 'general-shop-discussion';
export const TECHNICIAN_TOPICS_DISPLAY = '🔧';
export const TECHNICIAN_TOPICS_A11Y_LABEL = 'Technician Topics';

function tagSlug(tag) {
  if (!tag) return '';
  if (typeof tag.slug === 'function') return String(tag.slug() || '');
  return String(tag.slug || '');
}

function tagName(tag) {
  if (!tag) return '';
  if (typeof tag.name === 'function') return String(tag.name() || '');
  return String(tag.name || '');
}

function tagIsPrimary(tag) {
  if (!tag) return false;

  if (typeof tag.isPrimary === 'function') {
    return tag.isPrimary() === true;
  }
  if (typeof tag.isPrimary === 'boolean') {
    return tag.isPrimary === true;
  }

  const position = typeof tag.position === 'function' ? tag.position() : tag.position;
  const isChild = typeof tag.isChild === 'function' ? tag.isChild() : tag.isChild;
  return position != null && isChild !== true;
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
 * Resolve the stable board/context that owns a discussion.
 *
 * Priority:
 * 1. deepest matching Brand board;
 * 2. an explicit manifest link-board such as START or Technician Topics;
 * 3. any remaining Flarum primary tag.
 *
 * Secondary metadata tags (for example Job Breakdown) are never used as the
 * generic fallback destination.
 */
export function resolveDiscussionBoardTarget({ discussion = null, manifest = null } = {}) {
  const tags = discussionTags(discussion);
  if (!tags.length) return null;

  const brand = resolveDiscussionBrandBoard({ discussion, manifest });
  if (brand?.slug) {
    return {
      slug: String(brand.slug),
      name: String(brand.name || brand.slug),
      kind: 'brand',
    };
  }

  const slugs = new Set(tags.map(tagSlug).filter(Boolean));
  const linkGroup = (manifest?.groups || []).find(
    (group) =>
      group?.mode === 'link' &&
      group?.destination?.type === 'tag' &&
      group.destination.slug &&
      slugs.has(String(group.destination.slug))
  );

  if (linkGroup) {
    return {
      slug: String(linkGroup.destination.slug),
      name: String(linkGroup.label || linkGroup.destination.slug),
      kind: 'manifest',
    };
  }

  const primaryTag = tags.find((tag) => tagIsPrimary(tag) && tagSlug(tag));
  if (primaryTag) {
    const slug = tagSlug(primaryTag);
    return {
      slug,
      name: tagName(primaryTag) || slug,
      kind: 'primary-tag',
    };
  }

  return null;
}

function isTechnicianTopicsTarget(target) {
  if (!target) return false;
  return (
    target.slug === TECHNICIAN_TOPICS_SLUG ||
    target.name === TECHNICIAN_TOPICS_A11Y_LABEL ||
    target.name === 'Technician Topics'
  );
}

/**
 * Visible center-control label for a discussion.
 * Uses owning-board semantics (not Brand-only). Technician Topics renders as 🔧.
 * Fallback when no valid owning board exists: FlatRate.wiki / FLATRATE.WIKI.
 */
export function resolveDiscussionBrandTitle({ discussion = null, manifest = null } = {}) {
  const target = resolveDiscussionBoardTarget({ discussion, manifest });
  if (!target) {
    return PICK_A_BRAND;
  }

  if (isTechnicianTopicsTarget(target)) {
    return TECHNICIAN_TOPICS_DISPLAY;
  }

  return String(target.name || PICK_A_BRAND);
}

/**
 * Accessible name for the discussion center control.
 */
export function resolveDiscussionBrandAccessibleLabel({ discussion = null, manifest = null } = {}) {
  const target = resolveDiscussionBoardTarget({ discussion, manifest });
  if (!target) {
    return PICK_A_BRAND;
  }

  if (isTechnicianTopicsTarget(target)) {
    return TECHNICIAN_TOPICS_A11Y_LABEL;
  }

  return String(target.name || PICK_A_BRAND);
}
