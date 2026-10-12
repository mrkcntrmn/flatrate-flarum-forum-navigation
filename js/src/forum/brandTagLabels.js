import { extend } from 'flarum/common/extend';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';

import { isBrandTag } from './utils/brandTag';

export const BRAND_TAG_BACKGROUND = '#c72d5d';
export const BRAND_TAG_FOREGROUND = '#ffffff';

function renderLabels(tags, { link, manifest, tagLabel, sortTags }) {
  const children = [];
  sortTags(tags || []).forEach((tag) => {
    if (!tag && (tags || []).length !== 1) return;
    children.push(
      tagLabel(tag, {
        link,
        className: tag && isBrandTag(tag, manifest) ? 'FlatRateBrandTagLabel' : '',
      })
    );
  });
  return <span className="TagsLabel">{children}</span>;
}

/** Replace only the two native discussion tag-label items, retaining native
 * tag models, routes, ordering and helper markup. */
export default function registerBrandTagLabels({ getManifest, tagLabel, sortTags }) {
  if (!tagLabel || !sortTags) return;

  extend(DiscussionListItem.prototype, 'infoItems', function (items) {
    const tags = this.attrs.discussion.tags();
    if (!tags || !tags.length) return;
    items.add('tags', renderLabels(tags, { link: false, manifest: getManifest(), tagLabel, sortTags }), 10);
  });

  extend(DiscussionHero.prototype, 'items', function (items) {
    const tags = this.attrs.discussion.tags();
    if (!tags || !tags.length) return;
    items.add('tags', renderLabels(tags, { link: true, manifest: getManifest(), tagLabel, sortTags }), 5);
  });
}
