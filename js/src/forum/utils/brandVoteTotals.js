import app from 'flarum/forum/app';

export function brandVoteTotalsFromForum(forum = app.forum) {
  if (!forum || typeof forum.attribute !== 'function') {
    return null;
  }

  const raw = forum.attribute('flatRateBrandUpvotes');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  return raw;
}

export function brandVoteTotal(board, forum = app.forum) {
  const slug = board && board.slug;
  if (!slug) {
    return null;
  }

  const totals = brandVoteTotalsFromForum(forum);
  if (!totals || !Object.prototype.hasOwnProperty.call(totals, slug)) {
    return null;
  }

  const value = Number(totals[slug]);
  return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : null;
}

function tagSlug(tag) {
  return tag && typeof tag.slug === 'function' ? tag.slug() : tag && tag.slug;
}

function tagSubscription(tag) {
  if (!tag) {
    return null;
  }

  if (typeof tag.subscription === 'function') {
    return tag.subscription();
  }

  if (typeof tag.attribute === 'function') {
    return tag.attribute('subscription');
  }

  return tag.subscription || null;
}

/**
 * FoF Follow Tags treats both follow and lurk as positive "Following" states.
 * Keep exact-tag semantics: parent/child inheritance does not recolor totals.
 */
export function isBrandFollowed(board, store = app.store, session = app.session) {
  if (!board || !board.slug || !session || !session.user || !store || typeof store.all !== 'function') {
    return false;
  }

  const tag = (store.all('tags') || []).find((candidate) => tagSlug(candidate) === board.slug);
  const subscription = tagSubscription(tag);

  return subscription === 'follow' || subscription === 'lurk';
}
