import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import ItemList from 'flarum/common/utils/ItemList';

import PresentationNav from './components/PresentationNav';
import { resolveDiscussionBrandTitle } from './utils/discussionBrandTitle';
import { getNavigationManifest } from './utils/manifest';
import { PICK_A_BRAND } from './utils/presentationTitle';

app.initializers.add(
  'flatrate-discussion-center-menu',
  () => {
    // Flarum 1.8.19 uses the PostStreamScrubber as DiscussionPage's mobile
    // App-titleControl. Add a dedicated center dropdown instead. CSS hides the
    // scrubber only on phones, so desktop post navigation stays unchanged.
    extend(DiscussionPage.prototype, 'sidebarItems', function (items) {
      const manifest = getNavigationManifest();
      if (!manifest || !this.discussion) {
        return;
      }

      const pickerItems = new ItemList();
      pickerItems.add(
        'allDiscussions',
        <LinkButton className="Button--flat" href={app.route('index')} icon="far fa-comments">
          {app.translator.trans('core.forum.index.all_discussions_link')}
        </LinkButton>,
        100
      );
      pickerItems.add('flatratePresentationNav', <PresentationNav manifest={manifest} />, -14);

      if (items.items && items.items.flatrateDiscussionBrandPicker) {
        items.remove('flatrateDiscussionBrandPicker');
      }

      items.add(
        'flatrateDiscussionBrandPicker',
        <SelectDropdown
          buttonClassName="Button"
          className="App-titleControl FlatRateDiscussionBrandPicker"
          accessibleToggleLabel={PICK_A_BRAND}
          defaultLabel={resolveDiscussionBrandTitle({ discussion: this.discussion, manifest })}
        >
          {pickerItems.toArray()}
        </SelectDropdown>,
        -90
      );
    });
  },
  -50
);
