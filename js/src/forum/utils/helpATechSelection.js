/**
 * Candidate selector for Help a Tech.
 *
 * Implements board-scoped candidate selection and strict limiting:
 * - Requires adminPreviewEnabled === true
 * - Requires authenticated administrator viewer (client-gated)
 * - Requires valid board context
 * - Consumes discussions from the active board's result set
 * - Filters by strict discussion eligibility
 * - Preserves native discussion ordering from the active board
 * - Caps results strictly at 3 items (MAX_HELP_A_TECH_RESULTS = 3)
 * - Returns [] when 0 eligible (fail closed, zero display)
 */

import { isDiscussionEligibleForHelpATech } from './helpATechEligibility.js';

export const MAX_HELP_A_TECH_RESULTS = 3;

/**
 * Extracts discussions loaded for the active board from DiscussionListState.
 * Prevents scanning the global app.store cache and avoids stale cross-board leakage.
 */
export function getActiveBoardDiscussions(discussionsState) {
  if (!discussionsState || typeof discussionsState.getPages !== 'function') {
    return [];
  }
  const pages = discussionsState.getPages();
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }
  const items = [];
  for (const page of pages) {
    if (page && Array.isArray(page.items)) {
      for (const item of page.items) {
        if (item) {
          items.push(item);
        }
      }
    }
  }
  return items;
}

export function selectHelpATechDiscussions({
  discussions = [],
  viewer = null,
  context = null,
  adminPreviewEnabled = false,
  limit = MAX_HELP_A_TECH_RESULTS,
} = {}) {
  // 1. Rollout gate check: must be strictly boolean true
  if (adminPreviewEnabled !== true) {
    return [];
  }

  // 2. Viewer gate check: client-gated to authenticated admin
  if (!viewer || typeof viewer !== 'object') {
    return [];
  }
  const isAdmin = typeof viewer.isAdmin === 'function' ? viewer.isAdmin() : Boolean(viewer.isAdmin);
  if (!isAdmin) {
    return [];
  }

  // 3. Context check
  if (!context || !context.type || !context.slug) {
    return [];
  }

  // 4. Ensure discussions list is an array
  if (!Array.isArray(discussions) || discussions.length === 0) {
    return [];
  }

  // 5. Filter eligible candidates using native Flarum model semantics
  const eligible = discussions.filter((discussion) =>
    isDiscussionEligibleForHelpATech(discussion, { viewer, context })
  );

  if (eligible.length === 0) {
    return [];
  }

  // 6. Preserve native ordering from the active board's result set, strictly capped at maxCap
  const maxCap = Math.min(Math.max(0, limit), MAX_HELP_A_TECH_RESULTS);
  return eligible.slice(0, maxCap);
}
