import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import Navigation from 'flarum/common/components/Navigation';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import IndexPage from 'flarum/forum/components/IndexPage';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import ItemList from 'flarum/common/utils/ItemList';

import CenterQuickRail from './components/CenterQuickRail';
import {
  discussionCenterUsesTechnicianIcon,
  resolveDiscussionBoardTarget,
  resolveDiscussionBrandAccessibleLabel,
  resolveDiscussionBrandTitle,
} from './utils/discussionBrandTitle';
import { listDiscussionBrandBoards } from './utils/discussionBrandDropdownItems';
import { brandHref, getNavigationManifest, tagHref } from './utils/manifest';
import { resolveBoardStructuralBack } from './utils/boardStructuralBack';
import { recordOpenBoardAtTopIntent, consumeOpenBoardAtTopIntent } from './utils/boardBackIntent';
import icon from 'flarum/common/helpers/icon';
import { TECHNICIAN_TOPICS_ICON } from './utils/startNav';

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

function currentIndexRouteName() {
  const current = app.current;
  if (!current || typeof current.get !== 'function') return '';
  return String(current.get('routeName') || '');
}

function currentIndexBoardSlug() {
  const current = app.current;

  if (
    !current ||
    typeof current.matches !== 'function' ||
    !current.matches(IndexPage) ||
    current.matches(DiscussionPage)
  ) {
    return '';
  }

  const tag = typeof current.currentTag === 'function' ? current.currentTag() : null;
  if (tag) {
    return typeof tag.slug === 'function' ? String(tag.slug() || '') : String(tag.slug || '');
  }

  // Flarum Tags 1.8.x writes the active board slug from the /t/:tags
  // route into m.route before currentTag()/stickyParams are necessarily ready.
  // Navigation renders early on direct entry, so consult the canonical route
  // parameter before falling back to search state.
  try {
    const routeTag =
      typeof m !== 'undefined' && m.route && typeof m.route.param === 'function'
        ? m.route.param('tags')
        : '';
    if (routeTag) {
      return String(routeTag);
    }
  } catch (error) {
    // Fall through to sticky search state.
  }

  const sticky =
    app.search && typeof app.search.stickyParams === 'function' ? app.search.stickyParams() : {};
  return sticky && sticky.tags ? String(sticky.tags) : '';
}

function boardMainBackButton() {
  return (
    <LinkButton
      className="Button Navigation-back Button--icon FlatRateBoardBackToMain"
      href="/"
      icon="fas fa-chevron-left"
      aria-label="Back to MAIN"
      force
    />
  );
}

function discussionBoardBackButton(target) {
  // Explicit force documents the Mithril route-remount contract required for
  // board transitions (URL change alone is not acceptance).
  return (
    <LinkButton
      className="Button Navigation-back Button--icon FlatRateDiscussionBackToBoard"
      href={tagHref(target.slug)}
      icon="fas fa-chevron-left"
      aria-label={`Back to ${target.name}`}
      force
      onclick={() => {
        recordOpenBoardAtTopIntent();
      }}
    />
  );
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

      const boardTarget = resolveDiscussionBoardTarget({
        discussion: this.discussion,
        manifest,
      });
      const visibleTitle = resolveDiscussionBrandTitle({ discussion: this.discussion, manifest });
      const accessibleLabel = resolveDiscussionBrandAccessibleLabel({
        discussion: this.discussion,
        manifest,
      });
      const technicianTitle = discussionCenterUsesTechnicianIcon(boardTarget);

      const pickerItems = new ItemList();
      pickerItems.add(
        'flatrateQuickRail',
        <CenterQuickRail manifest={manifest} page={this} />,
        200
      );

      // SelectDropdown styles only li > a|button. Do not nest PresentationNav
      // (a <div> tree) here — production left item-flatratePresentationNav empty.
      // Reuse the canonical Brand manifest via LinkButton children instead.
      listDiscussionBrandBoards(manifest).forEach((board, index) => {
        pickerItems.add(
          `brand-${board.boardKey}`,
          <LinkButton
            className={`Button--flat FlatRateDiscussionPicker-link FlatRateDiscussionBrandLink depth-${board.depth}`}
            href={brandHref(board)}
            force
          >
            <span className="FlatRateDiscussionBrandName">{board.name}</span>
          </LinkButton>,
          -14 - index
        );
      });

      if (items.items && items.items.flatrateDiscussionBrandPicker) {
        items.remove('flatrateDiscussionBrandPicker');
      }

      items.add(
        'flatrateDiscussionBrandPicker',
        <SelectDropdown
          buttonClassName="Button"
          className={`App-titleControl FlatRateDiscussionBrandPicker ${technicianTitle ? 'FlatRatePresentationTitle--technician' : 'FlatRatePresentationTitle--contextual'}`}
          accessibleToggleLabel={accessibleLabel}
          defaultLabel={visibleTitle}
        >
          {pickerItems.toArray()}
        </SelectDropdown>,
        -90
      );
    });

    // Flarum 1.8.19 Navigation.view() renders through getBackButton() when
    // app history can go back, and getDrawerButton() on direct-entry/no-history.
    // Override both live seams with a stable owning-board LinkButton. Do not
    // invoke Flarum app-history back helpers — the board route is the destination.
    override(Navigation.prototype, 'getBackButton', function (original) {
      const target = currentDiscussionBoardTarget();
      if (target) {
        return discussionBoardBackButton(target);
      }

      const boardBack = resolveBoardStructuralBack({
        slug: currentIndexBoardSlug(),
        routeName: currentIndexRouteName(),
        manifest: getNavigationManifest(),
      });
      if (boardBack) {
        return boardMainBackButton();
      }

      return original();
    });

    override(Navigation.prototype, 'getDrawerButton', function (original) {
      const target = currentDiscussionBoardTarget();
      if (target) {
        return discussionBoardBackButton(target);
      }

      const boardBack = resolveBoardStructuralBack({
        slug: currentIndexBoardSlug(),
        routeName: currentIndexRouteName(),
        manifest: getNavigationManifest(),
      });
      if (boardBack) {
        return boardMainBackButton();
      }

      return original();
    });

    override(SelectDropdown.prototype, 'getButtonContent', function (original, children) {
      const content = original(children);
      const className = String((this.attrs && this.attrs.className) || '');
      if (!className.includes('FlatRateDiscussionBrandPicker') || !className.includes('FlatRatePresentationTitle--technician')) {
        return content;
      }

      const next = Array.isArray(content) ? content.slice() : [content];
      const hasWrench = next.some((node) =>
        String((node && node.attrs && node.attrs.className) || '').includes('fa-wrench')
      );
      if (!hasWrench) {
        next.unshift(icon(TECHNICIAN_TOPICS_ICON));
      }
      return next;
    });

    // Custom board-arrow: one-shot open-board-at-top intent. Native Back keeps
    // lastDiscussion restoration.
    extend(IndexPage.prototype, 'oninit', function () {
      if (consumeOpenBoardAtTopIntent()) {
        this.lastDiscussion = undefined;
        this.flatrateOpenBoardAtTop = true;
      }
    });

    extend(IndexPage.prototype, 'oncreate', function () {
      if (!this.flatrateOpenBoardAtTop) {
        return;
      }

      this.flatrateOpenBoardAtTop = false;

      if (typeof window !== 'undefined' && window.jQuery) {
        window.jQuery(window).scrollTop(0);
      } else if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
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
