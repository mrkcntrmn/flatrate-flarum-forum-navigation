/**
 * Canonical Brand tagline projection.
 *
 * Editorial copy lives in resources/brand-taglines.json. It must never mutate
 * Flarum tag.description() or taxonomy.
 */

import taglinesCatalog from './brandTaglinesData.js';
import { flattenBrandBoards } from './discussionBrandTitle.js';

function catalogEntries() {
  return Array.isArray(taglinesCatalog?.taglines) ? taglinesCatalog.taglines : [];
}

export function listBrandTaglineEntries() {
  return catalogEntries().map((entry) => ({
    key: String(entry.key || ''),
    name: String(entry.name || ''),
    tagline: String(entry.tagline || ''),
  }));
}

export function brandTaglineByKey(key) {
  const needle = String(key || '');
  if (!needle) return null;
  const entry = catalogEntries().find((item) => String(item.key) === needle);
  return entry?.tagline ? String(entry.tagline) : null;
}

/**
 * Resolve a tagline for the current Brand board only.
 * Non-Brand tags receive no tagline.
 */
export function resolveBrandTagline({ currentTag = null, manifest = null } = {}) {
  const slug =
    currentTag && typeof currentTag.slug === 'function'
      ? String(currentTag.slug() || '')
      : String(currentTag?.slug || '');

  if (!slug) return null;

  const brand = flattenBrandBoards(manifest).find(({ board }) => String(board?.slug || '') === slug);
  if (!brand?.board) return null;

  const key = String(brand.board.boardKey || brand.board.slug || '');
  return brandTaglineByKey(key);
}

/**
 * Parity helpers for tests: tagline keys must map to known Brand nodes or the
 * approved pending JLR family that control #548 will activate.
 */
export const PENDING_JLR_BRAND_KEYS = Object.freeze(['jlr', 'land-rover', 'range-rover']);

export function knownBrandKeysFromManifest(manifest) {
  return new Set(
    flattenBrandBoards(manifest)
      .map(({ board }) => String(board?.boardKey || board?.slug || ''))
      .filter(Boolean)
  );
}

export function taglineKeysWithoutBrandNode(manifest) {
  const known = knownBrandKeysFromManifest(manifest);
  return listBrandTaglineEntries()
    .map((entry) => entry.key)
    .filter((key) => key && !known.has(key) && !PENDING_JLR_BRAND_KEYS.includes(key));
}
