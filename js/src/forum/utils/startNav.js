export const START_NAV_LABEL = 'START';
export const START_NAV_COLOR = '#66ff00';
export const START_NAV_ICON = 'far fa-play-circle';
export const TECHNICIAN_TOPICS_ICON = 'fas fa-wrench';
export const BRAND_NAV_ICON = 'fas fa-car';

export function isStartNavGroup(group) {
  return group?.id === 'community' || group?.destination?.slug === 'start-here';
}

export function isTechnicianTopicsGroup(group) {
  return group?.id === 'technician-topics' || group?.destination?.slug === 'general-shop-discussion';
}
