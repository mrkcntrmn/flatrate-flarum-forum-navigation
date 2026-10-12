import app from 'flarum/forum/app';
import { actorNotificationsAvailable, planePresentation } from '../utils/mainNotifications';

export default class MainNotificationsButton {
  view() {
    if (!actorNotificationsAvailable(app)) {
      return null;
    }
    const badge = app.flatrateNotifications && typeof app.flatrateNotifications.badge === 'function'
      ? app.flatrateNotifications.badge()
      : null;
    const presentation = planePresentation(badge);
    const unread = !!presentation.badgeText;

    return (
      <button
        type="button"
        className={
          'Button Button--icon Button--flat App-primaryControl FlatRateMainNotifications'
          + (unread ? ' FlatRateMainNotifications--unread' : '')
        }
        aria-label={presentation.ariaLabel}
        onclick={() => {
          const path = app.route && app.routes && app.routes['flatrate-notifications.index']
            ? app.route('flatrate-notifications.index')
            : '/notifications';
          m.route.set(path);
        }}
      >
        <i className="fas fa-paper-plane Button-icon FlatRateMainNotifications-plane" aria-hidden="true" />
        {presentation.badgeText ? (
          <span className="FlatRateMainNotifications-badge" aria-hidden="true">
            {presentation.badgeText}
          </span>
        ) : null}
      </button>
    );
  }

  oncreate() {
    if (app.flatrateNotifications && typeof app.flatrateNotifications.refresh === 'function') {
      app.flatrateNotifications.refresh();
    }
  }
}
