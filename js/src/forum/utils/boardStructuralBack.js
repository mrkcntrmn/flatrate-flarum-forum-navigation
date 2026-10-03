/**
 * Structural board → MAIN back target.
 * Canonical Brand boards and Technician Topics only. MAIN and other boards
 * stay on the native hamburger / history seams.
 */

import { findBrandNodeBySlug } from './brandNode.js';
import { TECHNICIAN_TOPICS_SLUG } from './presentationTitle.js';

export const BOARD_BACK_TO_MAIN_LABEL = 'Back to MAIN';

export function resolveBoardStructuralBack({ slug = '', routeName = '', manifest = null } = {}) {
  if (routeName === 'following') return null;

  const value = String(slug || '');
  if (!value) return null;

  if (value === TECHNICIAN_TOPICS_SLUG || findBrandNodeBySlug(manifest, value)) {
    return {
      href: '/',
      accessibleLabel: BOARD_BACK_TO_MAIN_LABEL,
    };
  }

  return null;
}
