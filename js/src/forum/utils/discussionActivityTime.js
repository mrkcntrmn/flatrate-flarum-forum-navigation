export const DISCUSSION_ACTIVITY_VISIBLE_MS = 24 * 60 * 60 * 1000;

/**
 * Show relative list-row activity time only during the first 24 hours.
 * This is presentation-only: timestamps remain stored and usable elsewhere.
 *
 * Invalid or missing dates fail closed. The boundary is exclusive, so an
 * activity exactly 24 hours old no longer displays a date.
 */
export function showDiscussionActivityTime(timestamp, nowMs = Date.now()) {
  if (!timestamp) return false;

  const timeMs = timestamp instanceof Date
    ? timestamp.getTime()
    : new Date(timestamp).getTime();
  const elapsed = nowMs - timeMs;

  return Number.isFinite(timeMs)
    && Number.isFinite(nowMs)
    && elapsed >= 0
    && elapsed < DISCUSSION_ACTIVITY_VISIBLE_MS;
}
