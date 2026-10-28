import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';

function markStaticHero(vnode) {
  if (!vnode || !vnode.attrs) return;

  const className = String(vnode.attrs.className || '')
    .replace(/\bFlatRateBoardHero\b/g, '')
    .replace(/\bFlatRateBoardHero--(?:collapsed|expanded|static)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  vnode.attrs.className = `${className} FlatRateBoardHero FlatRateBoardHero--static`.trim();
}

/**
 * Keep MAIN and every tag/board hero visible and centered without dismissal or
 * disclosure controls. Native titles, descriptions, taglines, and family links
 * remain in the banner at all times.
 */
export default function registerBoardHeroDisclosure(TagHero) {
  // A historical `welcomeHidden` key must not make MAIN unreachable.
  override(WelcomeHero.prototype, 'isHidden', function () {
    const title = app.forum.attribute('welcomeTitle');
    return !String(title || '').trim() || this.hidden === true;
  });

  extend(WelcomeHero.prototype, 'bodyItems', function (items) {
    if (items && typeof items.remove === 'function') {
      items.remove('dismiss-button');
    }
  });

  extend(WelcomeHero.prototype, 'view', function (vnode) {
    markStaticHero(vnode);
  });

  if (!TagHero) return;

  extend(TagHero.prototype, 'view', function (vnode) {
    markStaticHero(vnode);
  });
}
