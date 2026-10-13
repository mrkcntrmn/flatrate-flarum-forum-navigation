/**
 * Candidate selector for Help a Tech.
 *
 * Implements deterministic candidate ordering and strict limiting:
 * - Requires adminPreviewEnabled === true
 * - Requires authenticated administrator viewer
 * - Requires valid board context
 * - Filters by strict discussion eligibility
 * - Sorts deterministically: fewest replies first, ties broken by newest createdAt
 * - Caps results strictly at 3 items (MAX_HELP_A_TECH_RESULTS = 3)
 * - Returns [] when 0 eligible (fail closed, zero display)
 */

import { isDiscussionEligibleForHelpATech } from './helpATechEligibility.js';

export const MAX_HELP_A_TECH_RESULTS = 3;

function getReplyCount(discussion) {
  if (typeof discussion.replyCount === 'function') {
    return Number(discussion.replyCount() || 0);
  }
  if (typeof discussion.commentCount === 'function') {
    return Number(discussion.commentCount() || 0);
  }
  if (discussion.replyCount !== undefined) {
    return Number(discussion.replyCount || 0);
  }
  if (discussion.commentCount !== undefined) {
    return Number(discussion.commentCount || 0);
  }
  if (discussion.attribute && typeof discussion.attribute === 'function') {
    return Number(discussion.attribute('commentCount') ?? discussion.attribute('replyCount') ?? 0);
  }
  return 0;
}

function getCreatedAtTime(discussion) {
  let val = null;
  if (typeof discussion.createdAt === 'function') {
    val = discussion.createdAt();
  } else if (discussion.createdAt !== undefined) {
    val = discussion.createdAt;
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    val = discussion.attribute('createdAt');
  }

  if (!val) return 0;
  const time = new Date(val).getTime();
  return isNaN(time) ? 0 : time;
}

function getDiscussionId(discussion) {
  if (typeof discussion.id === 'function') {
    return String(discussion.id() || '');
  }
  return String(discussion.id || '');
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

  // 2. Viewer gate check: must be authenticated admin
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

  // 5. Filter eligible candidates
  const eligible = discussions.filter((discussion) =>
    isDiscussionEligibleForHelpATech(discussion, { viewer, context })
  );

  if (eligible.length === 0) {
    return [];
  }

  // 6. Deterministic ordering: fewest replies first, ties broken by newest, then id
  const sorted = [...eligible].sort((a, b) => {
    const repliesDiff = getReplyCount(a) - getReplyCount(b);
    if (repliesDiff !== 0) {
      return repliesDiff;
    }

    const timeDiff = getCreatedAtTime(b) - getCreatedAtTime(a);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return getDiscussionId(a).localeCompare(getDiscussionId(b));
  });

  // 7. Strictly bound to max cap (max 3)
  const maxCap = Math.min(Math.max(0, limit), MAX_HELP_A_TECH_RESULTS);
  return sorted.slice(0, maxCap);
}
