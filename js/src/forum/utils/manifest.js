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
  if (typeof manifest?.generalLive?.available === 'boolean') {
    return manifest.generalLive.available;
  }
  return Boolean(manifest?.community?.generalLiveAvailable);
}

export function tagHref(slug) {
  return app.route('tag', { tags: slug });
}

export function pushToStartHref(manifest) {
  const slug =
    manifest?.groups?.find((group) => group.destination?.type === 'tag' && group.destination?.slug === 'start-here')
      ?.destination?.slug ||
    manifest?.pushToStart?.slug ||
    'start-here';
  return tagHref(slug);
}

export function startHereHref(manifest) {
  return pushToStartHref(manifest);
}

export function technicianTopicsHref(manifest) {
  const slug =
    manifest?.groups?.find((group) => group.id === 'technician-topics')?.destination?.slug ||
    'general-shop-discussion';
  return tagHref(slug);
}

export function groupLinkHref(group, manifest) {
  if (group?.destination?.type === 'tag' && group.destination.slug) {
    return tagHref(group.destination.slug);
  }
  return pushToStartHref(manifest);
}

export function brandHref(board) {
  return tagHref(board.slug);
}
