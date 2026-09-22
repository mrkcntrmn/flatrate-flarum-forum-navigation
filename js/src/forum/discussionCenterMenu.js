import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import Navigation from 'flarum/common/components/Navigation';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import IndexPage from 'flarum/forum/components/IndexPage';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import ItemList from 'flarum/common/utils/ItemList';

import {
  flattenBrandBoards,
  resolveDiscussionBoardTarget,
  resolveDiscussionBrandTitle,
} from './utils/discussionBrandTitle';
import { brandHref, getNavigationManifest, tagHref } from './utils/manifest';
import { PICK_A_BRAND } from './utils/presentationTitle';

function currentDiscussionBoardTarget() {
  const current = app.current;

  if (
    !current ||
    typeof current.matches !== 'function' ||
    !current.matches(DiscussionPage)
  ) {
    return null;
  }

  const discussion =
    typeof current.get === 'function'
      ? current.get('discussion')
      : null;

  return resolveDiscussionBoardTarget({
    discussion,
    manifest: getNavigationManifest(),
  });
}

function discussionBoardBackButton(target) {
  return (
    <LinkButton
      className="Button Navigation-back Button--icon FlatRateDiscussionBackToBoard"
      href={tagHref(target.slug)}
      icon="fas fa-chevron-left"
      aria-label={`Back to ${target.name}`}
      force
    />
  );
}

/**
 * Flarum 1.8.19 SelectDropdown treats each direct child as one menu item via
 * Dropdown.view -> listItems(vnode.children). Nested PresentationNav collapses
 * into a single empty/incorrect <li>; emit native LinkButton children instead.
 */
function discussionPickerItems(manifest) {
  const items = new ItemList();

  items.add(
    'allDiscussions',
    <LinkButton
      className="Button--flat FlatRateDiscussionPicker-link FlatRateDiscussionPicker-home"
      href={app.route('index')}
      icon="fas fa-warehouse"
      force
    >
      HOME
    </LinkButton>,
    1000
  );

  flattenBrandBoards(manifest).forEach(({ board, depth }, index) => {
    const key = board.boardKey || board.slug;

    items.add(
      `flatrateDiscussionBrand-${key}`,
      <LinkButton
        className="Button--flat FlatRateDiscussionPicker-link FlatRateDiscussionPicker-brandLink"
        itemClassName={`FlatRateDiscussionPicker-brand depth-${depth}`}
        href={brandHref(board)}
        force
      >
        {board.name}
      </LinkButton>,
      900 - index
    );
  });

  return items;
}

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
          {discussionPickerItems(manifest).toArray()}
        </SelectDropdown>,
        -90
      );
    });

    // Flarum 1.8.19 Navigation.view() renders through getBackButton() when
    // app history can go back, and getDrawerButton() on direct-entry/no-history.
    // Override both live seams with a stable owning-board LinkButton. Do not
    // invoke Flarum app-history back helpers — the board route is the destination.
    // Explicit force documents the required Mithril route remount contract.
    override(Navigation.prototype, 'getBackButton', function (original) {
      const target = currentDiscussionBoardTarget();

      if (!target) {
        return original();
      }

      return discussionBoardBackButton(target);
    });

    override(Navigation.prototype, 'getDrawerButton', function (original) {
      const target = currentDiscussionBoardTarget();

      if (!target) {
        return original();
      }

      return discussionBoardBackButton(target);
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
