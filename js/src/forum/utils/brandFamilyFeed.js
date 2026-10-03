/**
 * Read-side Brand family slug expansion.
 * Parent boards include themselves and every manifest descendant.
 * Leaf boards and unknown slugs stay exact. A missing manifest fails closed.
 */

import { findBrandNodeBySlug } from './brandNode.js';

export function resolveBrandFamilySlugs(manifest, activeSlug) {
  const slug = String(activeSlug || '').trim();
  if (!slug) return [];
  if (!manifest || !Array.isArray(manifest.groups)) return [slug];

  const node = findBrandNodeBySlug(manifest, slug);
  if (!node) return [slug];

  const slugs = [];
  const seen = new Set();

  function visit(board) {
    if (!board) return;
    const boardSlug = String(board.slug || '');
    if (boardSlug && !seen.has(boardSlug)) {
      seen.add(boardSlug);
      slugs.push(boardSlug);
    }
    (board.children || []).forEach(visit);
  }

  visit(node);
  return slugs.length ? slugs : [slug];
}
