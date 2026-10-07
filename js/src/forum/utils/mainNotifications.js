import { isCleanRootIndex } from './mainLandingPins.js';

export const PLANE_IDLE = '#ffffff';
export const PLANE_UNREAD = '#84cc16';
export const BADGE_BACKGROUND = '#c72d5d';
export const BADGE_TEXT = '#ffffff';
export const PLANE_TARGET_PX = 44;

/**
 * MAIN-only mount. Brand, Technician Topics, Push to Start, Following,
 * Discussion, Messages, and Notifications fail closed through the canonical
 * clean-root helper plus explicit page guards.
 */
export function shouldShowMainNotifications(context = {}) {
  if (!context.signedIn) return false;
  if (context.notificationsAvailable !== true) return false;
  if (!context.isIndexPage || context.isDiscussionPage) return false;
  if (context.isMessagesRoute || context.isNotificationsRoute) return false;
  return isCleanRootIndex({
    pathname: context.pathname,
    routeName: context.routeName,
    searchParams: context.searchParams,
    stickyParams: context.stickyParams,
    currentTag: context.currentTag,
    page: context.page ?? 1,
  });
}

export function badgeText(count) {
  const value = Number(count);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value > 99 ? '99+' : String(value);
}

export function planePresentation(badge) {
  if (!badge || badge.status !== 'known' || badge.count == null) {
    return {
      color: PLANE_IDLE,
      badgeText: null,
      badgeBackground: null,
      badgeColor: null,
      ariaLabel: 'Notifications',
    };
  }
  const count = Math.floor(Number(badge.count));
  if (!Number.isFinite(count) || count <= 0) {
    return {
      color: PLANE_IDLE,
      badgeText: null,
      badgeBackground: null,
      badgeColor: null,
      ariaLabel: 'Notifications',
    };
  }
  return {
    color: PLANE_UNREAD,
    badgeText: badgeText(count),
    badgeBackground: BADGE_BACKGROUND,
    badgeColor: BADGE_TEXT,
    ariaLabel: `Notifications, ${count} unread`,
  };
}

export function mainHeaderGeometry(width, { plane = PLANE_TARGET_PX, hamburger = 44 } = {}) {
  const titleMax = width - 120;
  return {
    width,
    plane,
    hamburger,
    titleMax,
    pass: plane >= 44 && hamburger >= 44 && titleMax >= 80 && plane + hamburger < width,
  };
}

export const REQUIRED_HEADER_WIDTHS = [320, 360, 390, 412, 430];
