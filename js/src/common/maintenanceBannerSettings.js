export const SETTING_ENABLED = 'flatrate-forum-navigation.maintenance_banner_enabled';
export const SETTING_MESSAGE = 'flatrate-forum-navigation.maintenance_banner_message';
export const SETTING_COLOR = 'flatrate-forum-navigation.maintenance_banner_color';
export const SETTING_REVISION = 'flatrate-forum-navigation.maintenance_banner_revision';

export const DEFAULT_MESSAGE = 'FLATRATE.WIKI is undergoing maintenance.';
export const DEFAULT_COLOR = 'red';

export const MAINTENANCE_BANNER_COLORS = [
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'pink', label: 'FLATRATE.WIKI Pink' },
];

export function normalizeSettingBool(value, missingDefault = true) {
  if (value === undefined || value === null || value === '') return missingDefault;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;
  return missingDefault;
}

export function normalizeColor(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return MAINTENANCE_BANNER_COLORS.some((option) => option.value === normalized)
    ? normalized
    : DEFAULT_COLOR;
}

export function maintenanceBannerStorageKey(revision) {
  const normalized = /^[A-Za-z0-9_-]{1,64}$/.test(String(revision || ''))
    ? String(revision)
    : 'fallback';
  return `flatrate:maintenance-banner:${normalized}`;
}
