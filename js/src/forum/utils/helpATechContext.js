/**
 * Context resolver for Help a Tech.
 *
 * Determines if the current page/tag context is supported for Help a Tech.
 * Supported contexts:
 * - Brand boards (from navigation manifest)
 * - Technician Topics ('general-shop-discussion' or 'technician-topics')
 *
 * Excluded contexts (fail closed):
 * - Root HOME index (clean root)
 * - Search results (q param)
 * - Following view
 * - Individual discussion page
 * - User profile
 * - START board ('start-here')
 */

import { findBrandNodeBySlug } from './brandNode.js';
import { TECHNICIAN_TOPICS_SLUG, START_HERE_SLUG, TECHNICIAN_TOPICS_LABEL } from './presentationTitle.js';

function extractTagSlug(tag) {
  if (!tag) return '';
  if (typeof tag.slug === 'function') return String(tag.slug() || '');
  return String(tag.slug || '');
}

export function resolveHelpATechContext({
  currentTag = null,
  routeName = '',
  searchParams = {},
  stickyParams = {},
  manifest = null,
} = {}) {
  // Exclude search queries
  const q = searchParams.q ?? searchParams.query;
  if (typeof q === 'string' && q.trim() !== '') {
    return null;
  }

  // Exclude following context
  if (routeName === 'following' || searchParams.onFollowing === true) {
    return null;
  }

  // Exclude discussion page and user profile
  if (routeName === 'discussion' || routeName === 'user') {
    return null;
  }

  const slug =
    extractTagSlug(currentTag) ||
    (searchParams && searchParams.tags) ||
    (stickyParams && stickyParams.tags) ||
    '';

  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  // Exclude START board
  if (normalizedSlug === START_HERE_SLUG) {
    return null;
  }

  // Check Technician Topics
  if (
    normalizedSlug === TECHNICIAN_TOPICS_SLUG ||
    normalizedSlug === 'technician-topics'
  ) {
    return {
      type: 'technician-topics',
      slug: normalizedSlug,
      label: TECHNICIAN_TOPICS_LABEL,
    };
  }

  // Check Brand boards from manifest
  if (manifest) {
    const brandNode = findBrandNodeBySlug(manifest, normalizedSlug);
    if (brandNode) {
      return {
        type: 'brand',
        slug: normalizedSlug,
        board: brandNode,
        label: brandNode.name || normalizedSlug,
      };
    }
  }

  return null;
}
