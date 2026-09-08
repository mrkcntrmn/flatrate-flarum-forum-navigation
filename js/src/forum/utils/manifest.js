import app from 'flarum/forum/app';

export function getNavigationManifest() {
  return app.forum.attribute('flatrateForumNavigationManifest') || null;
}

export function isGeneralLiveAvailable() {
  const fromAttr = app.forum.attribute('flatrateForumNavigationGeneralLiveAvailable');
  if (typeof fromAttr === 'boolean') {
    return fromAttr;
  }
  const manifest = getNavigationManifest();
  return Boolean(manifest?.community?.generalLiveAvailable);
}

export function startHereHref(manifest) {
  const slug = manifest?.community?.startHere?.slug || 'start-here';
  return app.route('tag', { tags: slug });
}

export function technicianTopicsHref(manifest) {
  const slug =
    manifest?.groups?.find((group) => group.id === 'technician-topics')?.destination?.slug ||
    'general-shop-discussion';
  return app.route('tag', { tags: slug });
}

export function brandHref(board) {
  return app.route('tag', { tags: board.slug });
}
