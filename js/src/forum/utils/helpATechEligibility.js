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

  // 2. Viewer eligibility check (H1 is client-gated to authenticated admin)
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

  // 4. Actor reply rights (strict affirmative canReply === true; Flarum DiscussionSerializer provides this)
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

  // 5. Private discussion exclusion (Finding H1-R1-03: canReply=true does not mean public)
  // Reconcile with FoF Byobu and private discussion extension contracts
  if (
    (typeof discussion.isPrivateDiscussion === 'function' && discussion.isPrivateDiscussion() === true) ||
    (discussion.attribute && typeof discussion.attribute === 'function' && discussion.attribute('isPrivateDiscussion') === true) ||
    discussion.isPrivateDiscussion === true ||
    (discussion.attribute && typeof discussion.attribute === 'function' && discussion.attribute('isPrivate') === true) ||
    discussion.isPrivate === true
  ) {
    return false;
  }

  // Recipient check: exclude any discussion targeted to recipient users or groups
  let recipientUsers = null;
  if (typeof discussion.recipientUsers === 'function') {
    recipientUsers = discussion.recipientUsers();
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    recipientUsers = discussion.attribute('recipientUsers');
  } else if (discussion.recipientUsers !== undefined) {
    recipientUsers = discussion.recipientUsers;
  }
  if (Array.isArray(recipientUsers) && recipientUsers.length > 0) {
    return false;
  }

  let recipientGroups = null;
  if (typeof discussion.recipientGroups === 'function') {
    recipientGroups = discussion.recipientGroups();
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    recipientGroups = discussion.attribute('recipientGroups');
  } else if (discussion.recipientGroups !== undefined) {
    recipientGroups = discussion.recipientGroups;
  }
  if (Array.isArray(recipientGroups) && recipientGroups.length > 0) {
    return false;
  }

  // 6. Hidden status check (Finding H1-R1-07: Flarum conditionally serializes isHidden only when hidden)
  let isHidden = false;
  if (typeof discussion.isHidden === 'function') {
    isHidden = Boolean(discussion.isHidden());
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isHidden = Boolean(discussion.attribute('isHidden') || discussion.attribute('hiddenAt'));
  } else if (discussion.isHidden !== undefined) {
    isHidden = Boolean(discussion.isHidden);
  }

  if (isHidden) {
    return false;
  }

  // 7. Locked status check (Finding H1-R1-07: flarum/lock provides isLocked only when locked or extension loaded)
  let isLocked = false;
  if (typeof discussion.isLocked === 'function') {
    isLocked = Boolean(discussion.isLocked());
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isLocked = Boolean(discussion.attribute('isLocked'));
  } else if (discussion.isLocked !== undefined) {
    isLocked = Boolean(discussion.isLocked);
  }

  if (isLocked) {
    return false;
  }

  // 8. Deleted status check (models marked deleted in client store or soft-deleted)
  let isDeleted = false;
  if (typeof discussion.isDeleted === 'function') {
    isDeleted = Boolean(discussion.isDeleted());
  } else if (discussion.attribute && typeof discussion.attribute === 'function') {
    isDeleted = Boolean(discussion.attribute('isDeleted'));
  } else if (discussion.isDeleted !== undefined) {
    isDeleted = Boolean(discussion.isDeleted);
  }

  if (isDeleted) {
    return false;
  }

  // 9. Author exclusion (Finding H1-R1-04: fail-closed on missing author identity)
  const viewerId = extractViewerId(viewer);
  const authorId = extractDiscussionAuthorId(discussion);
  if (!viewerId || !authorId) {
    // If author identity cannot be established affirmatively, fail closed to prevent self-recommendation
    return false;
  }
  if (String(viewerId) === String(authorId)) {
    return false;
  }

  // 10. Context relevance check: discussion must have tags that match the active board context
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
