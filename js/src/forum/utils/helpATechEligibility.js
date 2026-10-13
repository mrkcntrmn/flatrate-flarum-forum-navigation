/**
 * Eligibility validator for Help a Tech candidate discussions.
 *
 * Enforces the strict discussion eligibility contract:
 * - EXISTS: discussion model is non-null
 * - ACTOR_CAN_VIEW: actor can view discussion
 * - ACTOR_CAN_REPLY: actor has reply rights (canReply === true)
 * - NOT_DELETED: discussion is not deleted
 * - NOT_HIDDEN: discussion is not hidden
 * - NOT_LOCKED: discussion is not locked
 * - NOT_OWN_POST: author of discussion is not the viewing actor
 * - CONTEXT_RELEVANT: discussion is tagged in the current board context
 *
 * Fail closed on any missing, undefined, or malformed attributes.
 */

function extractTagSlugs(discussion) {
  let tags = [];
  if (typeof discussion.tags === 'function') {
    tags = discussion.tags() || [];
  } else if (Array.isArray(discussion.tags)) {
    tags = discussion.tags;
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    tags = discussion.attribute('tags') || [];
  }

  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (!tag) return '';
      if (typeof tag === 'string') return tag.toLowerCase();
      if (typeof tag.slug === 'function') return String(tag.slug() || '').toLowerCase();
      if (tag.slug) return String(tag.slug).toLowerCase();
      return '';
    })
    .filter(Boolean);
}

function extractViewerId(viewer) {
  if (!viewer) return null;
  if (typeof viewer.id === 'function') return viewer.id();
  return viewer.id || null;
}

function extractDiscussionAuthorId(discussion) {
  if (!discussion) return null;
  if (typeof discussion.user === 'function') {
    const user = discussion.user();
    if (user) {
      return typeof user.id === 'function' ? user.id() : user.id;
    }
  }
  if (discussion.user && typeof discussion.user === 'object') {
    return typeof discussion.user.id === 'function' ? discussion.user.id() : discussion.user.id;
  }
  if (discussion.attribute && typeof discussion.attribute === 'function') {
    return discussion.attribute('userId') || null;
  }
  return discussion.userId || null;
}

export function isDiscussionEligibleForHelpATech(discussion, { viewer = null, context = null } = {}) {
  // 1. Discussion existence and identifier check
  if (!discussion || typeof discussion !== 'object') {
    return false;
  }

  const id = typeof discussion.id === 'function' ? discussion.id() : discussion.id;
  if (!id) {
    return false;
  }

  const title = typeof discussion.title === 'function' ? discussion.title() : discussion.title;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return false;
  }

  // 2. Viewer eligibility check (H1 is admin-only)
  if (!viewer || typeof viewer !== 'object') {
    return false;
  }

  const isAdmin = typeof viewer.isAdmin === 'function' ? viewer.isAdmin() : Boolean(viewer.isAdmin);
  if (!isAdmin) {
    return false;
  }

  // 3. Context check
  if (!context || !context.type || !context.slug) {
    return false;
  }

  // 4. Actor reply rights (strict canReply === true)
  let canReply = false;
  if (typeof discussion.canReply === 'function') {
    canReply = discussion.canReply();
  } else if (discussion.canReply !== undefined) {
    canReply = discussion.canReply;
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    canReply = discussion.attribute('canReply');
  }

  if (canReply !== true) {
    return false;
  }

  // 5. Hidden status check (fail closed if hidden)
  let isHidden = false;
  if (typeof discussion.isHidden === 'function') {
    isHidden = Boolean(discussion.isHidden());
  } else if (discussion.isHidden !== undefined) {
    isHidden = Boolean(discussion.isHidden);
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isHidden = Boolean(discussion.attribute('isHidden') || discussion.attribute('hiddenAt'));
  }

  if (isHidden) {
    return false;
  }

  // 6. Locked status check (fail closed if locked)
  let isLocked = false;
  if (typeof discussion.isLocked === 'function') {
    isLocked = Boolean(discussion.isLocked());
  } else if (discussion.isLocked !== undefined) {
    isLocked = Boolean(discussion.isLocked);
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isLocked = Boolean(discussion.attribute('isLocked'));
  }

  if (isLocked) {
    return false;
  }

  // 7. Deleted status check
  let isDeleted = false;
  if (typeof discussion.isDeleted === 'function') {
    isDeleted = Boolean(discussion.isDeleted());
  } else if (discussion.isDeleted !== undefined) {
    isDeleted = Boolean(discussion.isDeleted);
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isDeleted = Boolean(discussion.attribute('isDeleted'));
  }

  if (isDeleted) {
    return false;
  }

  // 8. Author exclusion (do not recommend own discussion to the author)
  const viewerId = extractViewerId(viewer);
  const authorId = extractDiscussionAuthorId(discussion);
  if (viewerId && authorId && String(viewerId) === String(authorId)) {
    return false;
  }

  // 9. Context relevance check
  const tagSlugs = extractTagSlugs(discussion);
  if (!tagSlugs.length) {
    return false;
  }

  const targetSlug = String(context.slug).toLowerCase();

  if (context.type === 'technician-topics') {
    const isTechTopic = tagSlugs.some(
      (s) => s === 'technician-topics' || s === 'general-shop-discussion' || s === targetSlug
    );
    if (!isTechTopic) return false;
  } else if (context.type === 'brand') {
    // Check direct slug match
    let matchesBrand = tagSlugs.includes(targetSlug);

    // If context board has child boards (e.g. CDJR -> Chrysler, Dodge, Jeep, Ram), match children as well
    if (!matchesBrand && context.board && Array.isArray(context.board.children)) {
      matchesBrand = context.board.children.some((child) =>
        child && child.slug && tagSlugs.includes(String(child.slug).toLowerCase())
      );
    }

    if (!matchesBrand) return false;
  } else {
    return false;
  }

  return true;
}
