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

    extend(IndexPage.prototype, 'navItems', function (items) {
      // Hide native flat primary tag list used for presentation.
      // Run after flarum-tags so removals stick.
      const itemKeys = items.items ? Object.keys(items.items) : [];
      for (const key of itemKeys) {
        if (key === 'moreTags' || key === 'tags' || key === 'separator' || /^tag\d+$/.test(key)) {
          items.remove(key);
        }
      }

      const manifest = getNavigationManifest();
      if (!manifest) {
        return;
      }

      items.add(
        'flatratePresentationNav',
        <PresentationNav manifest={manifest} currentTag={this.currentTag?.() || null} />,
        -14
      );
    });
  },
  { after: 'flarum-tags' }
);
