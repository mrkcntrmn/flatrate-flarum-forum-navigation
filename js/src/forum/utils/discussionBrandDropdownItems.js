/**
 * Flatten the canonical Brand tree for DiscussionPage SelectDropdown children.
 *
 * Flarum SelectDropdown/listItems wraps each child in <li class="item-*"> and
 * styles only direct > a / > button. A nested PresentationNav <div> lands in an
 * empty item-flatratePresentationNav slot in production. Emit LinkButton-ready
 * board descriptors instead — same manifest, no second Brand data model.
 */

export function listDiscussionBrandBoards(manifest) {
  const brandsGroup = (manifest?.groups || []).find(
    (group) => group && group.mode === 'tree' && group.id === 'brands'
  );

  if (!brandsGroup) {
    return [];
  }

  const boards = [];

  function walk(board, depth) {
    if (!board || !board.boardKey || !board.slug) {
      return;
    }

    boards.push({
      boardKey: board.boardKey,
      name: board.name,
      slug: board.slug,
      depth,
    });

    const children = Array.isArray(board.children) ? board.children : [];
    for (const child of children) {
      walk(child, depth + 1);
    }
  }

  for (const board of brandsGroup.boards || []) {
    walk(board, 0);
  }

  return boards;
}
