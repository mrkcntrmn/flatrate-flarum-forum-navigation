import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import { getNavigationManifest, pushToStartHref } from '../utils/manifest';
import { START_NAV_ICON, START_NAV_LABEL } from '../utils/startNav';

const START_BOARD_PIN_COLLAPSED_KEY = 'flatrate:start-board-pin:collapsed:v1';

function readCollapsedPreference() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    return window.localStorage.getItem(START_BOARD_PIN_COLLAPSED_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function writeCollapsedPreference(collapsed) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(START_BOARD_PIN_COLLAPSED_KEY, collapsed ? '1' : '0');
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
    this.collapsed = readCollapsedPreference();
  }

  toggleCollapsed(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.collapsed = !this.collapsed;
    writeCollapsedPreference(this.collapsed);
  }

  view() {
    const manifest = this.attrs.manifest || getNavigationManifest();
    const href = pushToStartHref(manifest);
    const collapsed = this.collapsed === true;

    return (
      <div
        className={`FlatRateStartBoardPin${collapsed ? ' is-collapsed' : ''}`}
        data-flatrate-start-board-pin="true"
        data-flatrate-start-board-pin-collapsed={collapsed ? 'true' : 'false'}
      >
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
            className="FlatRateStartBoardPin-toggle"
            aria-label={collapsed ? `Expand ${START_NAV_LABEL} pinned board` : `Collapse ${START_NAV_LABEL} pinned board`}
            aria-expanded={collapsed ? 'false' : 'true'}
            onclick={(event) => this.toggleCollapsed(event)}
          >
            {icon(collapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up')}
          </button>
        </div>
      </div>
    );
  }
}
