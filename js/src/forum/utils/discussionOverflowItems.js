function isOverflowSeparator(item) {
  return String((item && item.itemName) || '').endsWith('Separator');
}

/**
 * Drop section separators that no longer sit between actions.
 * Removing the canonical `subscription` control can leave `userSeparator`
 * as the only user-section item, which must not render an empty overflow.
 */
export function discussionOverflowItems(items) {
  let start = 0;
  let end = items.length;

  while (start < end && isOverflowSeparator(items[start])) start += 1;
  while (end > start && isOverflowSeparator(items[end - 1])) end -= 1;

  const trimmed = items.slice(start, end);
  return trimmed.some((item) => !isOverflowSeparator(item)) ? trimmed : [];
}
