const CANONICAL_GENERAL_LIVE_ROUTE = '/live/community-general-live';
const CANONICAL_GENERAL_LIVE_ROOM_KEY = 'community-general-live';

function isSafeLiveRoute(value) {
  return typeof value === 'string' && /^\/live\/[a-z0-9-]+$/.test(value);
}

export function canonicalGeneralLiveRoute(manifest) {
  const route = manifest?.generalLive?.route ?? manifest?.community?.generalLive?.route;
  const roomKey = manifest?.generalLive?.roomKey ?? manifest?.community?.generalLive?.roomKey;
  const available =
    manifest?.generalLive?.available ?? manifest?.community?.generalLiveAvailable;
  if (available !== true) return null;
  if (roomKey && roomKey !== CANONICAL_GENERAL_LIVE_ROOM_KEY) return null;
  if (!isSafeLiveRoute(route)) return null;
  return route;
}

/**
 * Prefer a valid runtime override, else the embedded manifest route.
 * Never fall back to `#`.
 */
export function resolveGeneralLiveHref({ runtimeRoute, manifest } = {}) {
  if (isSafeLiveRoute(runtimeRoute)) return runtimeRoute;
  return canonicalGeneralLiveRoute(manifest);
}

export { CANONICAL_GENERAL_LIVE_ROUTE, CANONICAL_GENERAL_LIVE_ROOM_KEY };
