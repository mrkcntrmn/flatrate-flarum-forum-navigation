import { maintenanceBannerStorageKey } from '../common/maintenanceBannerSettings';

export function applyMaintenanceBanner(application = null) {
  const currentApp = application;
  const banner = document.getElementById('flatrate-maintenance-banner');

  if (!banner) return;

  const config =
    currentApp && currentApp.forum && typeof currentApp.forum.attribute === 'function'
      ? currentApp.forum.attribute('flatrateMaintenanceBanner')
      : null;

  if (!config || config.enabled !== true || typeof config.message !== 'string' || !config.message.trim()) {
    banner.remove();
    return;
  }

  const copy = banner.querySelector('.FlatRateMaintenanceBanner-copy');
  if (!copy) {
    banner.remove();
    return;
  }

  copy.textContent = config.message.trim();

  if (config.backgroundColor) {
    banner.style.setProperty('--flatrate-maintenance-bg', String(config.backgroundColor));
  }
  if (config.textColor) {
    banner.style.setProperty('--flatrate-maintenance-fg', String(config.textColor));
  }

  const storageKey = maintenanceBannerStorageKey(config.revision);
  let dismissed = false;

  try {
    dismissed = window.localStorage.getItem(storageKey) === 'dismissed';
  } catch (error) {
    dismissed = false;
  }

  if (dismissed) {
    banner.remove();
    return;
  }

  const drawer = document.getElementById('drawer');
  if (drawer && drawer.parentNode) {
    drawer.parentNode.insertBefore(banner, drawer.nextSibling);
  }

  banner.hidden = false;

  const dismissButton = banner.querySelector('.FlatRateMaintenanceBanner-dismiss');
  if (!dismissButton) return;

  dismissButton.addEventListener('click', () => {
    try {
      window.localStorage.setItem(storageKey, 'dismissed');
    } catch (error) {
      // Storage can be unavailable in hardened/private browsing modes.
    }

    banner.remove();
  });
}
