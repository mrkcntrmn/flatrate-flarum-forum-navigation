/**
 * One-shot navigation intent for the custom FlatRate discussion board-back
 * control. Native/browser Back must continue restoring lastDiscussion.
 */

export const OPEN_BOARD_AT_TOP_KEY = 'flatrate:open-board-at-top';

export function recordOpenBoardAtTopIntent() {
  try {
    window.sessionStorage.setItem(OPEN_BOARD_AT_TOP_KEY, '1');
  } catch (error) {
    // sessionStorage can be unavailable in hardened/private browsing modes.
  }
}

/**
 * Consume the one-shot intent. Returns true exactly once per recorded click.
 */
export function consumeOpenBoardAtTopIntent() {
  try {
    if (window.sessionStorage.getItem(OPEN_BOARD_AT_TOP_KEY) !== '1') {
      return false;
    }
    window.sessionStorage.removeItem(OPEN_BOARD_AT_TOP_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
