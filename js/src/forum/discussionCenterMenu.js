import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import Navigation from 'flarum/common/components/Navigation';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import IndexPage from 'flarum/forum/components/IndexPage';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import ItemList from 'flarum/common/utils/ItemList';

import PresentationNav from './components/PresentationNav';
import { resolveDiscussionBrandBoard, resolveDiscussionBrandTitle } from './utils/discussionBrandTitle';
import { brandHref, getNavigationManifest } from './utils/manifest';
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
        <LinkButton className="Button--flat" href={app.route('index')} icon="fas fa-warehouse">
          HOME
        </LinkButton>,
        100
      );
      pickerItems.add('flatratePresentationNav', <PresentationNav manifest={manifest} hideStart />, -14);

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

    // A discussion is a child of its most specific Brand board. Replace the
    // history-driven arrow with that stable parent destination, including when
    // the discussion was opened directly and Flarum has no history to pop.
    extend(Navigation.prototype, 'items', function (items) {
      if (!app.current || typeof app.current.matches !== 'function' || !app.current.matches(DiscussionPage)) {
        return;
      }

      const discussion =
        typeof app.current.get === 'function' ? app.current.get('discussion') : null;
      const manifest = getNavigationManifest();
      const board = resolveDiscussionBrandBoard({ discussion, manifest });

      // Non-brand discussions keep native Flarum history behavior.
      if (!board) {
        return;
      }

      if (items.items && items.items.back) {
        items.remove('back');
      }

      items.add(
        'back',
        <LinkButton
          className="Button Navigation-back Button--icon FlatRateDiscussionBackToBrand"
          href={brandHref(board)}
          icon="fas fa-chevron-left"
          aria-label={`Back to ${board.name}`}
        />,
        90
      );
    });

    // Keep the phone header's right-hand primary slot available for the board
    // follow control. New Discussion moves into the list toolbar instead.
    extend(IndexPage.prototype, 'sidebarItems', function (items) {
      if (items.items && items.items.newDiscussion) {
        items.remove('newDiscussion');
      }
    });

    // Replace the refresh / mark-all-read pair with one explicit compose action.
    // This keeps the sort control on the left and a single + action on the right.
    extend(IndexPage.prototype, 'actionItems', function (items) {
      if (items.items && items.items.refresh) {
        items.remove('refresh');
      }
      if (items.items && items.items.markAllAsRead) {
        items.remove('markAllAsRead');
      }
      if (items.items && items.items.newDiscussion) {
        items.remove('newDiscussion');
      }

      const canStartDiscussion = app.forum.attribute('canStartDiscussion') || !app.session.user;
      const label = app.translator.trans(
        `core.forum.index.${canStartDiscussion ? 'start_discussion_button' : 'cannot_start_discussion_button'}`
      );

      items.add(
        'newDiscussion',
        <Button
          icon="fas fa-plus"
          className="Button Button--icon FlatRateInlineNewDiscussion"
          title={label}
          aria-label={label}
          onclick={() => this.newDiscussionAction().catch(() => {})}
          disabled={!canStartDiscussion}
        />,
        100
      );
    });
  },
  -50
);
