import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';

import CommunityPage from './components/CommunityPage';
import PresentationNav from './components/PresentationNav';
import { getNavigationManifest } from './utils/manifest';

app.initializers.add(
  'flatrate-forum-navigation',
  () => {
    app.routes.community = {
      path: '/community',
      component: CommunityPage,
    };

    const stripNativeTagPresentation = (items) => {
      const itemKeys = items.items ? Object.keys(items.items) : [];
      for (const key of itemKeys) {
        if (
          key === 'moreTags' ||
          key === 'tags' ||
          key === 'separator' ||
          key.startsWith('tag')
        ) {
          items.remove(key);
        }
      }
    };

    extend(IndexPage.prototype, 'navItems', function (items) {
      // Hide native flat primary tag list used for presentation.
      // Registered after flarum-tags so removals apply after tag injection.
      stripNativeTagPresentation(items);

      const manifest = getNavigationManifest();
      if (!manifest) {
        return;
      }

      // Replace any prior presentation block on redraw.
      if (items.items && items.items.flatratePresentationNav) {
        items.remove('flatratePresentationNav');
      }

      items.add(
        'flatratePresentationNav',
        <PresentationNav manifest={manifest} currentTag={this.currentTag?.() || null} />,
        -14
      );

      // Final pass in case another extender re-injected tags at the same priority.
      stripNativeTagPresentation(items);
    });
  },
  { after: 'flarum-tags' }
);
