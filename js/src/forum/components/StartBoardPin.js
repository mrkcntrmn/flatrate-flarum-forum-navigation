import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import { getNavigationManifest, pushToStartHref } from '../utils/manifest';
import { START_NAV_ICON, START_NAV_LABEL } from '../utils/startNav';

/**
 * First-class pinned START board shortcut for the HOME discussion index.
 * Presentation navigation only — not a Discussion model.
 */
export default class StartBoardPin extends Component {
  view() {
    const manifest = this.attrs.manifest || getNavigationManifest();
    const href = pushToStartHref(manifest);

    return (
      <div className="FlatRateStartBoardPin" data-flatrate-start-board-pin="true">
        <Link
          className="FlatRateStartBoardPin-link"
          href={href}
          aria-label={`${START_NAV_LABEL} — pinned board`}
        >
          <span className="FlatRateStartBoardPin-pin" aria-hidden="true">
            {icon('fas fa-thumbtack')}
          </span>
          <span className="FlatRateStartBoardPin-icon" aria-hidden="true">
            {icon(START_NAV_ICON)}
          </span>
          <span className="FlatRateStartBoardPin-label">{START_NAV_LABEL}</span>
        </Link>
      </div>
    );
  }
}
