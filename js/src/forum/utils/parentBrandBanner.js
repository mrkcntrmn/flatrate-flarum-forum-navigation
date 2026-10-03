/**
 * Collapsed parent-banner facts. The component renders these; tests assert
 * them without booting Mithril. Leaf boards have no disclosure.
 */

import { listDirectBrandChildren } from './brandNode.js';

export function parentBrandBannerModel({ board = null, tagline = '' } = {}) {
  const children = listDirectBrandChildren(board);
  if (!children.length) {
    return {
      disclosure: false,
      tagline: tagline || null,
      childNames: [],
      showsParentName: false,
      showsParentTotal: false,
    };
  }

  return {
    disclosure: true,
    tagline: tagline || null,
    childNames: children.map((child) => child.name),
    showsParentName: false,
    showsParentTotal: false,
  };
}
