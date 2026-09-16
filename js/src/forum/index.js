import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import icon from 'flarum/common/helpers/icon';

import PresentationNav from './components/PresentationNav';
import { withDefaultRootSort, withRootSortOrder } from './utils/defaultRootSort';
import { getNavigationManifest, pushToStartHref } from './utils/manifest';
import { resolvePresentationTitle, TECHNICIAN_TOPICS_LABEL } from './utils/presentationTitle';
import { START_NAV_ICON, START_NAV_LABEL, TECHNICIAN_TOPICS_ICON } from './utils/startNav';
import { stripNativeTagPresentation } from './utils/stripNativeTagPresentation';

function hideDrawerAfterLinkClick(event) {
  const target = event && event.target;
  if (!target || typeof target.closest !== 'function' || !target.closest('a')) {
    return;
  }
  if (app.drawer && typeof app.drawer.hide === 'function') {
    app.drawer.hide();
  }
}

function currentPathname() {
  return window.location && window.location.pathname ? window.location.pathname : '/';
}

function followingDrawerHref() {
  const params =
    app.search && typeof app.search.stickyParams === 'function' ? app.search.stickyParams() : {};
  if (app.routes && app.routes.following) {
    return app.route('following', params);
  }
  return '/following';
}

/**
 * Flarum Tags 1.8.19 injects tags/separator/tag<ID>/moreTags through
 * IndexPage.prototype.navItems (addTagList.js). Keep that seam.
 *
 * Flarum 1.8 Application.initializers is an ItemList: higher numeric
 * priority boots first. flarum-tags uses the default 0, so a negative
 * priority boots after addTagList has wrapped navItems.
 */
app.initializers.add(
  'flatrate-forum-navigation',
  () => {
    // Flarum 1.8.19 has no root-index default-sort setting. Keep the clean
    // canonical `/` URL while treating Top as the implicit root-feed sort.
    // Searches retain relevance-first behavior, non-root pages retain native
    // behavior, and explicit user-selected sorts remain authoritative.
    override(app.search, 'params', function (original) {
      return withDefaultRootSort(original(), currentPathname());
    });

    override(app.discussions, 'sortMap', function (original) {
      const params = app.search && typeof app.search.params === 'function' ? app.search.params() : {};
      return withRootSortOrder(original(), params, currentPathname());
    });

    extend(IndexPage.prototype, 'navItems', function (items) {
      // Registered after flarum-tags so removals apply after tag injection.
      stripNativeTagPresentation(items);

      const manifest = getNavigationManifest();
      if (!manifest) {
        return;
      }

      if (items.items && items.items.flatratePresentationNav) {
        items.remove('flatratePresentationNav');
      }

      items.add(
        'flatratePresentationNav',
        <PresentationNav manifest={manifest} currentTag={this.currentTag?.() || null} />,
        -14
      );

      stripNativeTagPresentation(items);
    });

    // Phone hamburger is Flarum's App-drawer, which renders HeaderSecondary.
    // Desktop keeps IndexPage sideNav; CSS hides these copies at tablet-up.
    extend(HeaderSecondary.prototype, 'items', function (items) {
      if (app.session && app.session.user && app.routes && app.routes.following) {
        if (items.items && items.items.flatrateDrawerFollowing) {
          items.remove('flatrateDrawerFollowing');
        }

        items.add(
          'flatrateDrawerFollowing',
          <div
            className="FlatRateDrawerFollowing"
            oncreate={(vnode) => {
              vnode.dom.addEventListener('click', hideDrawerAfterLinkClick);
            }}
          >
            <LinkButton className="Button--flat" href={followingDrawerHref()} icon="fas fa-star">
              {app.translator.trans('flarum-subscriptions.forum.index.following_link')}
            </LinkButton>
          </div>,
          -10
        );
      }

      const manifest = getNavigationManifest();
      if (!manifest) {
        return;
      }

      if (items.items && items.items.flatrateDrawerStart) {
        items.remove('flatrateDrawerStart');
      }

      items.add(
        'flatrateDrawerStart',
        <div
          className="FlatRateDrawerStart"
          oncreate={(vnode) => {
            vnode.dom.addEventListener('click', hideDrawerAfterLinkClick);
          }}
        >
          <LinkButton
            className="Button--flat FlatRateDrawerStart-link"
            href={pushToStartHref(manifest)}
            icon={START_NAV_ICON}
          >
            {START_NAV_LABEL}
          </LinkButton>
        </div>,
        -15
      );

      if (items.items && items.items.flatrateDrawerNav) {
        items.remove('flatrateDrawerNav');
      }

      items.add(
        'flatrateDrawerNav',
        <div
          className="FlatRateDrawerNav"
          oncreate={(vnode) => {
            vnode.dom.addEventListener('click', hideDrawerAfterLinkClick);
          }}
        >
          <PresentationNav manifest={manifest} />
        </div>,
        -20
      );
    });

    // Annotate only the IndexPage title-control SelectDropdown.
    extend(IndexPage.prototype, 'sidebarItems', function (items) {
      const nav = typeof items.get === 'function' ? items.get('nav') : items.items?.nav?.content;
      if (nav && nav.attrs) {
        nav.attrs.flatratePresentationTitle = true;
      }
    });

    // Honor the annotation only. Other SelectDropdowns stay core.
    // Flarum 1.8.19 extend() ignores callback returns; override() is the
    // seam that can replace getButtonContent([icon?, label, caret?]).
    override(SelectDropdown.prototype, 'getButtonContent', function (original, children) {
      const content = original(children);
      if (!this.attrs || this.attrs.flatratePresentationTitle !== true) {
        return content;
      }

      const current = app.current;
      const routeName =
        (current && typeof current.get === 'function' && current.get('routeName')) ||
        (app.current && app.current.data && app.current.data.routeName) ||
        '';
      const searchContext =
        (app.search && typeof app.search.params === 'function' && app.search.params()) || {};
      const routeContext =
        (app.search && typeof app.search.stickyParams === 'function' && app.search.stickyParams()) || {};
      let currentTag = null;
      if (current && typeof current.currentTag === 'function') {
        currentTag = current.currentTag();
      }
      const tagSlug = (searchContext && searchContext.tags) || (routeContext && routeContext.tags);
      if (!currentTag && tagSlug && app.store && typeof app.store.all === 'function') {
        currentTag = app.store.all('tags').find((tag) => {
          const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
          return slug === tagSlug;
        }) || null;
      }
      // PageState.matches(FollowingPage) is true on IndexPage too because
      // FollowingPage extends IndexPage. Use the following route/param only.
      const followingActive = routeName === 'following' || searchContext.onFollowing === true;

      const resolved = resolvePresentationTitle({
        currentTag,
        routeName,
        routeContext,
        searchContext,
        activeCoreContext: followingActive ? 'following' : '',
        manifest: getNavigationManifest(),
      });

      if (resolved == null) {
        return content;
      }

      const next = Array.isArray(content) ? content.slice() : [content];
      const labelIndex = next.findIndex(
        (node) => node && node.attrs && String(node.attrs.className || '').includes('Button-label')
      );
      const isStart = resolved === START_NAV_LABEL;
      const isTechnician = resolved === TECHNICIAN_TOPICS_LABEL;
      const label = (
        <span className={isStart ? 'Button-label FlatRatePresentationTitle--start' : 'Button-label'}>
          {resolved}
        </span>
      );
      if (labelIndex >= 0) {
        next[labelIndex] = label;
      } else {
        next[0] = label;
      }
      const iconNeedle = isStart ? 'fa-play-circle' : isTechnician ? 'fa-wrench' : '';
      const linkIcon = isStart ? START_NAV_ICON : isTechnician ? TECHNICIAN_TOPICS_ICON : null;
      if (linkIcon) {
        const hasItemIcon = next.some((node) =>
          String((node && node.attrs && node.attrs.className) || '').includes(iconNeedle)
        );
        if (!hasItemIcon) {
          next.splice(labelIndex >= 0 ? labelIndex : 0, 0, icon(linkIcon));
        }
      }
      return next;
    });
  },
  -50
);
