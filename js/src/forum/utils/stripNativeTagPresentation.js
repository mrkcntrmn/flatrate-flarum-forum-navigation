/**
 * Remove Flarum Tags 1.8.19 IndexPage.navItems presentation items.
 *
 * flarum-tags/js/src/forum/addTagList.js extends IndexPage.prototype.navItems
 * and adds: tags, separator, tag<ID>, moreTags.
 *
 * Keep allDiscussions and following. Qualify `separator` so an unrelated
 * plugin separator is not removed unless Tags presentation is present.
 */
const TAGS_PRESENTATION_KEYS = new Set(['tags', 'moreTags']);

export function isNativeTagItemKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (TAGS_PRESENTATION_KEYS.has(key)) return true;
  return /^tag\d+$/.test(key);
}

export function stripNativeTagPresentation(items) {
  if (!items || !items.items) return items;

  const keys = Object.keys(items.items);
  const hasTagsPresentation = keys.some((key) => isNativeTagItemKey(key));

  for (const key of keys) {
    if (isNativeTagItemKey(key)) {
      items.remove(key);
    }
  }

  if (hasTagsPresentation && keys.includes('separator') && typeof items.remove === 'function') {
    items.remove('separator');
  }

  return items;
}
