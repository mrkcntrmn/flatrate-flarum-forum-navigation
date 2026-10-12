import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';

export const MAIN_HERO_DETAILS_ID = 'flatrate-main-board-hero-details';

function tagSlug(hero) {
  const tag = hero && hero.attrs ? (hero.attrs.model || hero.attrs.tag) : null;
  if (!tag) return 'board';
  const slug = typeof tag.slug === 'function' ? tag.slug() : tag.slug;
  return String(slug || 'board').replace(/[^a-z0-9_-]+/gi, '-');
}

function findByClass(vnode, needle) {
  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      const found = findByClass(child, needle);
      if (found) return found;
    }
    return null;
  }
  if (!vnode || typeof vnode !== 'object') return null;
  const className = vnode.attrs ? String(vnode.attrs.className || '') : '';
  if (className.split(/\s+/).includes(needle)) return vnode;

  const children = Array.isArray(vnode.children) ? vnode.children : [vnode.children];
  for (const child of children) {
    const found = findByClass(child, needle);
    if (found) return found;
  }
  return null;
}

function setHeroState(hero, vnode, detailsId) {
  if (!vnode || !vnode.attrs) return;
  const expanded = hero.flatRateBoardHeroExpanded === true;
  const flag = expanded ? 'FlatRateBoardHero--expanded' : 'FlatRateBoardHero--collapsed';
  const className = String(vnode.attrs.className || '')
    .replace(/\bFlatRateBoardHero\b/g, '')
    .replace(/\bFlatRateBoardHero--(?:collapsed|expanded)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  vnode.attrs.className = `${className} FlatRateBoardHero ${flag}`.trim();

  const details = findByClass(vnode, 'containerNarrow');
  if (details) {
    const children = Array.isArray(details.children) ? details.children : [details.children];
    const title = [];
    const toggle = [];
    const body = [];
    children.forEach((child) => {
      if (findByClass(child, 'Hero-title')) title.push(child);
      else if (findByClass(child, 'FlatRateBoardHero-toggleRow')) toggle.push(child);
      else if (child != null) body.push(child);
    });
    details.children = [
      ...title,
      ...toggle,
      <div className="FlatRateBoardHero-details" id={detailsId} aria-hidden={expanded ? 'false' : 'true'}>
        {body}
      </div>,
    ];
  }
}

function addToggle(hero, items, detailsId, label) {
  const expanded = hero.flatRateBoardHeroExpanded === true;
  items.add(
    'flatrateBoardHeroToggle',
    <div className="FlatRateBoardHero-toggleRow">
      <Button
        className="Button Button--icon Button--flat FlatRateBoardHero-toggle"
        icon={expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls={detailsId}
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        onclick={(event) => {
          event.preventDefault();
          hero.flatRateBoardHeroExpanded = !hero.flatRateBoardHeroExpanded;
        }}
      />
    </div>,
    95
  );
}

/**
 * Give MAIN and every tag/board hero the same title-first disclosure contract.
 * The state is deliberately per-mount and never persisted.
 */
export default function registerBoardHeroDisclosure(TagHero) {
  extend(WelcomeHero.prototype, 'oninit', function () {
    this.flatRateBoardHeroExpanded = false;
  });

  // The new disclosure replaces permanent dismissal. A historical
  // `welcomeHidden` key must not make MAIN unreachable.
  override(WelcomeHero.prototype, 'isHidden', function () {
    const title = app.forum.attribute('welcomeTitle');
    return !String(title || '').trim() || this.hidden === true;
  });

  extend(WelcomeHero.prototype, 'viewItems', function (items) {
    if (items && typeof items.remove === 'function') {
      items.remove('dismiss-button');
    }
  });

  extend(WelcomeHero.prototype, 'contentItems', function (items) {
    addToggle(this, items, MAIN_HERO_DETAILS_ID, 'main board details');
  });

  extend(WelcomeHero.prototype, 'view', function (vnode) {
    setHeroState(this, vnode, MAIN_HERO_DETAILS_ID);
  });

  if (!TagHero) return;

  extend(TagHero.prototype, 'oninit', function () {
    this.flatRateBoardHeroExpanded = false;
    this.flatRateBoardHeroDetailsId = `flatrate-board-hero-${tagSlug(this)}-details`;
  });

  extend(TagHero.prototype, 'contentItems', function (items) {
    const tag = this.attrs.model || this.attrs.tag;
    const name = tag && (typeof tag.name === 'function' ? tag.name() : tag.name);
    addToggle(this, items, this.flatRateBoardHeroDetailsId, `${name || 'board'} details`);
  });

  extend(TagHero.prototype, 'view', function (vnode) {
    setHeroState(this, vnode, this.flatRateBoardHeroDetailsId);
  });
}
