/**
 * Manifest-driven Brand node helpers.
 */

import { flattenBrandBoards } from './discussionBrandTitle.js';

export function findBrandNodeBySlug(manifest, slug) {
  const needle = String(slug || '');
  if (!needle) return null;

  const match = flattenBrandBoards(manifest).find(({ board }) => String(board?.slug || '') === needle);
  return match?.board || null;
}

/**
 * Direct children only. Manifest order preserved. No grandchildren.
 */
export function listDirectBrandChildren(board) {
  if (!board || !Array.isArray(board.children)) {
    return [];
  }

  return board.children.filter((child) => child && child.slug && child.name);
}
