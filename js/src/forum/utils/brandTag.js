import { flattenBrandBoards } from './discussionBrandTitle.js';

function value(model, key) {
  if (!model) return '';
  return typeof model[key] === 'function' ? model[key]() : model[key];
}

export function brandTagSlugs(manifest) {
  return new Set(
    flattenBrandBoards(manifest)
      .map(({ board }) => String(board && board.slug || ''))
      .filter(Boolean)
  );
}

export function isBrandTag(tag, manifest) {
  return brandTagSlugs(manifest).has(String(value(tag, 'slug') || ''));
}
