import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';

import DiscussionFollowStar from './components/DiscussionFollowStar';
import DiscussionHeroActionsMenu from './components/DiscussionHeroActionsMenu';
import { canMutateDiscussionFollow } from './utils/discussionFollowState';

export const DISCUSSION_HERO_DETAILS_ID = 'FlatRateDiscussionHero-details';

export function isPhoneScreen() {
  try {
    return typeof app.screen === 'function' && app.screen() === 'phone';
  } catch (error) {
    return false;
  }
}

function removeItem(items, key) {
  if (!items) return;
  if (typeof items.has === 'function' && items.has(key) && typeof items.remove === 'function') {
    items.remove(key);
    return;
  }
  if (items.items && items.items[key] && typeof items.remove === 'function') {
    items.remove(key);
  }
}

function findHeroList(vnode) {
  const children = vnode && Array.isArray(vnode.children) ? vnode.children : [];
  for (const child of children) {
    if (!child || !child.attrs) continue;
    const className = String(child.attrs.className || '');
    if (className.includes('DiscussionHero-items')) return child;
    const nested = findHeroList(child);
    if (nested) return nested;
  }
  return null;
}

/**
 * Phone discussion chrome: header Follow star, no native controls dropdown,
 * no large Follow button, and a collapsed hero that hides existing ItemList
 * additions without replacing DiscussionHero.items().
 */
export default function registerDiscussionPhoneChrome() {
  extend(DiscussionPage.prototype, 'sidebarItems', function (items) {
    if (!isPhoneScreen()) return;

    removeItem(items, 'controls');
    removeItem(items, 'subscription');

    if (!this.discussion || !canMutateDiscussionFollow(app.session && app.session.user)) {
      return;
    }

    items.add('flatrateDiscussionFollow', <DiscussionFollowStar discussion={this.discussion} />, 100);
  });

  extend(DiscussionHero.prototype, 'oninit', function () {
    this.flatrateHeroExpanded = false;
  });

  extend(DiscussionHero.prototype, 'items', function (items) {
    if (!isPhoneScreen() || !this.attrs.discussion) return;

    const expanded = this.flatrateHeroExpanded === true;
    items.add(
      'flatrateHeroToggle',
      <Button
        className="Button Button--icon Button--flat FlatRateDiscussionHero-toggle"
        icon={expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls={DISCUSSION_HERO_DETAILS_ID}
        aria-label={expanded ? 'Collapse discussion details' : 'Expand discussion details'}
        onclick={(event) => {
          event.preventDefault();
          this.flatrateHeroExpanded = !this.flatrateHeroExpanded;
        }}
      />,
      50
    );

    items.add(
      'flatrateHeroSecondary',
      <DiscussionHeroActionsMenu
        discussion={this.attrs.discussion}
        context={app.current}
      />,
      -10
    );
  });

  extend(DiscussionHero.prototype, 'view', function (vnode) {
    if (!vnode || !vnode.attrs || !isPhoneScreen()) return;

    const expanded = this.flatrateHeroExpanded === true;
    const flag = expanded ? 'FlatRateDiscussionHero--expanded' : 'FlatRateDiscussionHero--collapsed';
    const className = String(vnode.attrs.className || '')
      .replace(/\bFlatRateDiscussionHero--(?:collapsed|expanded)\b/g, '')
      .trim();
    vnode.attrs.className = `${className} ${flag}`.trim();

    const list = findHeroList(vnode);
    if (list) {
      list.attrs.id = DISCUSSION_HERO_DETAILS_ID;
    }
  });
}

export function discussionHeroStartsCollapsed() {
  return true;
}
