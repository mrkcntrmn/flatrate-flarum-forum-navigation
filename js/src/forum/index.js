import { hasItem } from './utils/itemList.js';
import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import LinkButton from 'flarum/common/components/LinkButton';
import SelectDropdown from 'flarum/common/components/SelectDropdown';
import icon from './utils/icon';

import PresentationNav from './components/PresentationNav';
import CenterQuickRail from './components/CenterQuickRail';
import './quickRailSettingsPage';
import StartBoardPin from './components/StartBoardPin';
import MainLiveChatPin from './components/MainLiveChatPin';
import BrandLivePin from './components/BrandLivePin';
import MainLandingPins from './components/MainLandingPins';
import { applyMaintenanceBanner } from './maintenanceBanner';
import BrandFamilyLinks from './components/BrandFamilyLinks';
import './discussionCenterMenu';
import registerCompactDiscussionActivity from './compactDiscussionActivity';
import registerDiscussionPhoneChrome from './discussionPhoneChrome';
import registerComposerAccessibility from './composerAccessibility';
import registerBoardHeroDisclosure from './boardHeroDisclosure';
import { getNavigationManifest, pushToStartHref } from './utils/manifest';
import { resolvePresentationTitle, resolvePresentationTitleMode, TECHNICIAN_TOPICS_LABEL } from './utils/presentationTitle';
import {
  addStartBoardPinItem,
  removeStartBoardPinItem,
  shouldShowStartBoardPin,
} from './utils/startBoardPin';
import {
  addMainLiveChatItem,
  getLiveMainProvider,
  removeMainLiveChatItem,
  shouldShowMainLiveChat,
} from './utils/mainLiveChat';
import { START_NAV_ICON, START_NAV_LABEL, TECHNICIAN_TOPICS_ICON } from './utils/startNav';
import { stripNativeTagPresentation } from './utils/stripNativeTagPresentation';
import { resolveBrandTagline } from './utils/brandTagline';
import { hrefForBoardKey as boardHrefForKey } from './utils/boardRoutes';
import { findBrandNodeBySlug } from './utils/brandNode';
import {
  addBrandLiveItem,
  getLiveBoardProvider,
  prepareBrandLiveMount,
  removeBrandLiveItem,
} from './utils/brandLivePin';
import { isCleanRootIndex, mainPinIdsFromForum } from './utils/mainLandingPins';
import { actorNotificationsAvailable, shouldShowMainNotifications } from './utils/mainNotifications';
import MainNotificationsButton from './components/MainNotificationsButton';

function resolveTagHero() {
  try {
    // Resolve inside the initializer, after flarum-tags has registered compat.
    // A module-eval miss stays null for the rest of the page.
    const TagHeroModule = require('ext:flarum/tags/forum/components/TagHero');
    return TagHeroModule && TagHeroModule.default ? TagHeroModule.default : TagHeroModule;
  } catch (error) {
    return null;
  }
}

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

function currentPageNumber() {
  try {
    const page = m.route.param('page');
    return (page && Number(page)) || 1;
  } catch (error) {
    return 1;
  }
}

function followingDrawerHref() {
  const params =
    app.search?.state && typeof app.search.state.stickyParams === 'function' ? app.search.state.stickyParams() : {};
  if (app.routes && app.routes.following) {
    return app.route('following', params);
  }
  return '/following';
}

function rootContext() {
  const current = app.current;
  const routeName =
    (current && typeof current.get === 'function' && current.get('routeName')) ||
    (current && current.data && current.data.routeName) ||
    '';
  const searchParams =
    (app.search?.state && typeof app.search.state.params === 'function' && app.search.state.params()) || {};
  const stickyParams =
    (app.search?.state && typeof app.search.state.stickyParams === 'function' && app.search.state.stickyParams()) || {};
  const currentTag =
    typeof app.currentTag === 'function' ? app.currentTag() : null;

  return { routeName, searchParams, stickyParams, currentTag };
}

function currentPresentationContext() {
  const current = app.current;
  const routeName =
    (current && typeof current.get === 'function' && current.get('routeName')) ||
    (app.current && app.current.data && app.current.data.routeName) ||
    '';
  const searchContext =
    (app.search?.state && typeof app.search.state.params === 'function' && app.search.state.params()) || {};
  const routeContext =
    (app.search?.state && typeof app.search.state.stickyParams === 'function' && app.search.state.stickyParams()) || {};
  let currentTag = null;
  if (typeof app.currentTag === 'function') {
    currentTag = app.currentTag();
  }
  const tagSlug = (searchContext && searchContext.tags) || (routeContext && routeContext.tags);
  if (!currentTag && tagSlug && app.store && typeof app.store.all === 'function') {
    currentTag = app.store.all('tags').find((tag) => {
      const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
      return slug === tagSlug;
    }) || null;
  }
  const followingActive = routeName === 'following' || searchContext.onFollowing === true;

  return {
    currentTag,
    routeName,
    routeContext,
    searchContext,
    activeCoreContext: followingActive ? 'following' : '',
    manifest: getNavigationManifest(),
  };
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
    // Flarum assigns app.forum after initializers return, then calls mount.
    // Applying here used to see a missing forum model and delete the shell.
    extend(app, 'mount', function () {
      applyMaintenanceBanner(app);
    });

    const TagHero = resolveTagHero();

    app.flatRateBoardRoutes = {
      hrefForBoardKey(boardKey) {
        return boardHrefForKey(boardKey, {
          manifest: getNavigationManifest(),
          routeTag(slug) {
            return app.route('tag', { tags: slug });
          },
        });
      },
    };

    registerDiscussionPhoneChrome();
    registerComposerAccessibility();
    registerCompactDiscussionActivity();

    // Native Latest is the authenticated MAIN default. Do not force sort=top
    // or rewrite `/` to `/?sort=latest`.

    extend(IndexSidebar.prototype, 'navItems', function (items) {
      // Registered after flarum-tags so removals apply after tag injection.
      stripNativeTagPresentation(items);

      const manifest = getNavigationManifest();
      if (!manifest) {
        return;
      }

      if (hasItem(items, 'flatrateQuickRail')) {
        items.remove('flatrateQuickRail');
      }

      if (hasItem(items, 'flatratePresentationNav')) {
        items.remove('flatratePresentationNav');
      }

      items.add(
        'flatrateQuickRail',
        <CenterQuickRail manifest={manifest} page={this} />,
        200
      );

      items.add(
        'flatratePresentationNav',
        <PresentationNav manifest={manifest} currentTag={app.currentTag?.() || null} />,
        -14
      );

      stripNativeTagPresentation(items);
    });

    // Content composition for MAIN landing pins + START board pin.
    extend(IndexPage.prototype, 'contentItems', function (items) {
      const { routeName, searchParams, stickyParams, currentTag } = rootContext();
      const pathname = currentPathname();
      const page = currentPageNumber();
      const signedIn = !!(app.session && app.session.user);
      const cleanRoot = isCleanRootIndex({
        pathname,
        routeName,
        searchParams,
        stickyParams,
        currentTag,
        page: 1,
      });
      const pageOneCleanRoot = isCleanRootIndex({
        pathname,
        routeName,
        searchParams,
        stickyParams,
        currentTag,
        page,
      });

      // Public MAIN: curated pins only — hide ordinary feed/sort/pagination/START/Live.
      if (!signedIn && cleanRoot) {
        removeMainLiveChatItem(items);
        removeStartBoardPinItem(items);
        if (hasItem(items, 'toolbar')) {
          items.remove('toolbar');
        }
        if (hasItem(items, 'discussionList')) {
          items.remove('discussionList');
        }
        if (hasItem(items, 'flatrateMainLandingPins')) {
          items.remove('flatrateMainLandingPins');
        }
        items.add(
          'flatrateMainLandingPins',
          <MainLandingPins audience="public" />,
          105
        );
        return;
      }

      // Synthetic General Live row (priority 120). Fail closed without provider.
      if (
        signedIn &&
        shouldShowMainLiveChat({
          signedIn: true,
          pathname,
          routeName,
          searchParams,
          stickyParams,
          currentTag,
          page,
          provider: getLiveMainProvider(app),
        })
      ) {
        addMainLiveChatItem(items, <MainLiveChatPin />);
      } else {
        removeMainLiveChatItem(items);
      }

      const manifest = getNavigationManifest();
      const brandMount = prepareBrandLiveMount({
        page: this,
        currentTag,
        searchParams,
        stickyParams,
        store: app.store,
        signedIn,
        routeName,
        pageNumber: page,
        manifest,
        provider: getLiveBoardProvider(app),
      });
      if (brandMount.show && brandMount.board) {
        addBrandLiveItem(items, <BrandLivePin board={brandMount.board} />);
      } else {
        removeBrandLiveItem(items);
      }

      // Signed-in START pin (independent of discussion MAIN pins).
      if (
        signedIn &&
        shouldShowStartBoardPin({
          pathname,
          routeName,
          searchParams,
          stickyParams,
          currentTag,
        })
      ) {
        addStartBoardPinItem(items, <StartBoardPin manifest={getNavigationManifest()} />);
      } else {
        removeStartBoardPinItem(items);
      }

      // Member MAIN pins on clean root page 1 only.
      if (hasItem(items, 'flatrateMainLandingPins')) {
        items.remove('flatrateMainLandingPins');
      }

      if (signedIn && pageOneCleanRoot) {
        const memberIds = mainPinIdsFromForum(app.forum, 'member');
        if (memberIds.length) {
          items.add('flatrateMainLandingPins', <MainLandingPins audience="member" />, 105);
        }
      }
    });

    // Member ordinary root feed: exclude configured member pin IDs before pagination.
    override(app.discussions, 'requestParams', function (original) {
      const params = original();
      const { routeName, searchParams, stickyParams, currentTag } = rootContext();
      const signedIn = !!(app.session && app.session.user);

      if (
        signedIn &&
        isCleanRootIndex({
          pathname: currentPathname(),
          routeName,
          searchParams,
          stickyParams,
          currentTag,
          page: 1,
        }) &&
        !searchParams.q &&
        mainPinIdsFromForum(app.forum, 'member').length
      ) {
        params.filter = { ...(params.filter || {}), flatrateExcludeMainPins: 'member' };
      }

      return params;
    });

    // F2 server preload does not include our member-pin exclusion. Consume it
    // before core loadPage can bypass requestParams and render duplicate pins.
    override(app.discussions, 'loadPage', function (original, ...args) {
      if (this.requestParams().filter?.flatrateExcludeMainPins === 'member') {
        app.preloadedApiDocument();
      }
      return original(...args);
    });

    // Phone hamburger is Flarum's App-drawer, which renders HeaderSecondary.
    // Desktop keeps IndexPage sideNav; CSS hides these copies at tablet-up.
    extend(HeaderSecondary.prototype, 'items', function (items) {
      if (app.session && app.session.user && app.routes && app.routes.following) {
        if (hasItem(items, 'flatrateDrawerFollowing')) {
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

      if (hasItem(items, 'flatrateDrawerStart')) {
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

      // MAIN is a phone-drawer affordance that sits immediately above the
      // brand tree. Internal class names may still say Home.
      if (hasItem(items, 'flatrateDrawerHome')) {
        items.remove('flatrateDrawerHome');
      }

      items.add(
        'flatrateDrawerHome',
        <div
          className="FlatRateDrawerHome"
          oncreate={(vnode) => {
            vnode.dom.addEventListener('click', hideDrawerAfterLinkClick);
          }}
        >
          <LinkButton
            className="Button--flat FlatRateDrawerHome-link"
            href={app.route('index')}
            icon="fas fa-warehouse"
            aria-label="MAIN"
          >
            MAIN
          </LinkButton>
        </div>,
        -19
      );

      if (hasItem(items, 'flatrateDrawerNav')) {
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

    // MAIN top-right paper plane. Brand follow and discussion Follow stay on
    // their own primary-control seams; this item is clean-root only.
    extend(IndexSidebar.prototype, 'items', function (items) {
      if (hasItem(items, 'flatrateMainNotifications')) {
        items.remove('flatrateMainNotifications');
      }
      const { routeName, searchParams, stickyParams, currentTag } = rootContext();
      if (!shouldShowMainNotifications({
        signedIn: !!(app.session && app.session.user),
        notificationsAvailable: actorNotificationsAvailable(app),
        isIndexPage: true,
        isDiscussionPage: false,
        isMessagesRoute: false,
        isNotificationsRoute: false,
        pathname: currentPathname(),
        routeName,
        searchParams,
        stickyParams,
        currentTag,
        page: currentPageNumber(),
      })) {
        return;
      }
      items.add('flatrateMainNotifications', <MainNotificationsButton />, 200);
    });

    // Annotate only the IndexPage title-control SelectDropdown.
    extend(IndexSidebar.prototype, 'items', function (items) {
      const nav = typeof items.get === 'function' ? items.get('nav') : items.items?.nav?.content;
      if (nav && nav.attrs) {
        nav.attrs.flatratePresentationTitle = true;
        const mode = resolvePresentationTitleMode(currentPresentationContext());
        const base = String(nav.attrs.className || '')
          .replace(/\bFlatRatePresentationTitle--(?:root|contextual|technician)\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        nav.attrs.className = mode ? `${base} FlatRatePresentationTitle--${mode}`.trim() : base;
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

      // PageState.matches(FollowingPage) is true on IndexPage too because
      // FollowingPage extends IndexPage. Use the following route/param only.
      const resolved = resolvePresentationTitle(currentPresentationContext());

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

    // Brand hero: tagline + parent family links via TagHero when flarum-tags is present.
    if (TagHero) {
      extend(TagHero.prototype, 'view', function (vnode) {
        const tag = this.attrs.model || this.attrs.tag;
        if (!tag || !vnode || !vnode.children) {
          return;
        }

        const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
        const manifest = getNavigationManifest();
        const board = findBrandNodeBySlug(manifest, slug);
        if (!board) {
          return;
        }

        const tagline = resolveBrandTagline({ currentTag: tag, manifest });
        const extras = [];
        const heroClass = String(vnode.attrs.className || '');
        if (!heroClass.includes('FlatRateBrandHero')) {
          vnode.attrs.className = `${heroClass} FlatRateBrandHero`.trim();
        }

        if (tagline) {
          extras.push(
            <p className="FlatRateBrandTagline Hero-subtitle" key="flatrate-brand-tagline">
              {tagline}
            </p>
          );
        }
        extras.push(<BrandFamilyLinks board={board} key="flatrate-brand-family" />);

        const content = Array.isArray(vnode.children) ? vnode.children : [vnode.children];
        let inserted = false;
        for (let i = 0; i < content.length; i++) {
          const child = content[i];
          const className = child && child.attrs && String(child.attrs.className || '');
          if (className.includes('container')) {
            const containerChildren = Array.isArray(child.children) ? child.children.slice() : [child.children];

            const narrow = containerChildren.find((node) => {
              const nodeClass = node && node.attrs && String(node.attrs.className || '');
              return nodeClass.includes('containerNarrow');
            });
            if (narrow) {
              const narrowChildren = Array.isArray(narrow.children)
                ? narrow.children.slice()
                : [narrow.children];
              narrowChildren.push(...extras.filter(Boolean));
              narrow.children = narrowChildren;
            } else {
              containerChildren.push(...extras.filter(Boolean));
            }
            child.children = containerChildren;
            inserted = true;
            break;
          }
        }

        if (!inserted) {
          content.push(...extras.filter(Boolean));
          vnode.children = content;
        }
      });
    }

    // Register after Brand hero augmentation so the disclosure's details
    // wrapper includes taglines, family links, and any earlier hero additions.
    registerBoardHeroDisclosure(TagHero);
  },
  -50
);
