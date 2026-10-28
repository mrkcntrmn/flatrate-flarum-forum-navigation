export function hasItem(items, key) {
  return typeof items?.has === 'function' ? items.has(key) : !!items?.items?.[key];
}

export function itemKeys(items) {
  return Object.keys(typeof items?.toObject === 'function' ? items.toObject() : items?.items || {});
}
