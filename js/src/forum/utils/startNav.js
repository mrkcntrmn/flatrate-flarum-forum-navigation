export const START_NAV_LABEL = 'START';
export const START_NAV_COLOR = '#66ff00';
export const START_NAV_ICON = 'far fa-play-circle';

export function isStartNavGroup(group) {
  return group?.id === 'community' || group?.destination?.slug === 'start-here';
}
