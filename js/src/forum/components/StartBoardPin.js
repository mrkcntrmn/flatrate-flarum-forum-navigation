import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import { getNavigationManifest, pushToStartHref } from '../utils/manifest';
import { START_NAV_ICON, START_NAV_LABEL } from '../utils/startNav';

const START_BOARD_PIN_DISMISSED_KEY = 'flatrate:start-board-pin:dismissed:v1';

function readDismissedPreference() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    return window.localStorage.getItem(START_BOARD_PIN_DISMISSED_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function writeDismissedPreference(dismissed) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(START_BOARD_PIN_DISMISSED_KEY, dismissed ? '1' : '0');
  } catch (error) {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

/**
 * First-class pinned START board shortcut for the HOME discussion index.
 * Presentation navigation only — not a Discussion model.
 */
export default class StartBoardPin extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.dismissed = readDismissedPreference();
  }

  dismiss(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.dismissed = true;
    writeDismissedPreference(true);
  }

  view() {
    if (this.dismissed === true) {
      return null;
    }

    const manifest = this.attrs.manifest || getNavigationManifest();
    const href = pushToStartHref(manifest);

    return (
      <div className="FlatRateStartBoardPin" data-flatrate-start-board-pin="true">
        <div className="FlatRateStartBoardPin-bar">
          <span className="FlatRateStartBoardPin-pin" aria-hidden="true">
            {icon('fas fa-thumbtack')}
          </span>

          <Link
            className="FlatRateStartBoardPin-link"
            href={href}
            aria-label={`${START_NAV_LABEL} — pinned board`}
          >
            <span className="FlatRateStartBoardPin-icon" aria-hidden="true">
              {icon(START_NAV_ICON)}
            </span>
            <span className="FlatRateStartBoardPin-label">{START_NAV_LABEL}</span>
          </Link>

          <button
            type="button"
            className="FlatRateStartBoardPin-close"
            aria-label={`Close ${START_NAV_LABEL} pinned board`}
            onclick={(event) => this.dismiss(event)}
          >
            {icon('fas fa-times')}
          </button>
        </div>
      </div>
    );
  }
}
