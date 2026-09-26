import IndexPage from 'flarum/forum/components/IndexPage';

/**
 * Canonical Start Discussion seam.
 *
 * The production icon vocabulary is not one bottom-bar component:
 * - Profile: Flarum avatar helper + app.route.user (core session menu)
 * - Messages: flatrate-messaging.index route `/messages` (messaging-ui owns unread)
 * - New Discussion: IndexPage.prototype.newDiscussionAction
 *   flarum/tags addTagComposer.js extends that method and reads this.currentTag()
 * - Technician Topics: navigation manifest
 * - MAIN: app.route('index')
 *
 * DiscussionPage does not own newDiscussionAction. Reuse the IndexPage prototype
 * method, which flarum-tags already wraps, and supply currentTag so tag prefill
 * stays on the same composer instance.
 */
export function openCanonicalNewDiscussion(page) {
  if (page && typeof page.newDiscussionAction === 'function') {
    return page.newDiscussionAction();
  }

  const host = Object.create(IndexPage.prototype);
  host.currentTag = function currentTag() {
    return currentTagFromPage(page);
  };

  return IndexPage.prototype.newDiscussionAction.call(host);
}

function currentTagFromPage(page) {
  if (page && typeof page.currentTag === 'function') {
    return page.currentTag();
  }

  const discussion = page && page.discussion;
  if (!discussion || typeof discussion.tags !== 'function') {
    return null;
  }

  const tags = discussion.tags() || [];
  const primary = tags.find((tag) => {
    if (!tag) return false;
    const position = typeof tag.position === 'function' ? tag.position() : tag.position;
    const child = typeof tag.isChild === 'function' ? tag.isChild() : false;
    return position != null && !child;
  });

  return primary || tags[0] || null;
}

export function closeCenterSheetFrom(dom) {
  if (!dom || typeof dom.closest !== 'function') {
    return;
  }

  const dropdown = dom.closest('.Dropdown');
  if (!dropdown) {
    return;
  }

  dropdown.classList.remove('open');
  const toggle = dropdown.querySelector('[data-toggle="dropdown"]');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (typeof window !== 'undefined' && window.jQuery) {
    window.jQuery(dropdown).trigger('hidden.bs.dropdown');
  }
}
