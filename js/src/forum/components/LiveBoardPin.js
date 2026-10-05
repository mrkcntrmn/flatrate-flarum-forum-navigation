import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import { visibleLiveCount } from '../utils/mainLiveChat';

/**
 * Shared compact Live pin: PUBLIC globe LIVE count chat icon.
 * Not a Discussion. Callers own rollout and routing.
 */
export default class LiveBoardPin extends Component {
  view() {
    const { href, count, countLabel, ariaLabel, marker } = this.attrs;
    const shownCount = visibleLiveCount(count);
    const row = (
      <div className="FlatRateMainLiveChat-row">
        <Link className="FlatRateMainLiveChat-link" href={href} aria-label={ariaLabel}>
          <span className="FlatRateMainLiveChat-status" aria-hidden="true">
            <span>PUBLIC</span>
            <i className="fas fa-globe FlatRateMainLiveChat-globe" />
            <span>LIVE</span>
            {shownCount != null ? (
              <span className="FlatRateMainLiveChat-count" aria-label={countLabel}>
                {String(shownCount)}
              </span>
            ) : null}
            <span className="FlatRateMainLiveChat-icon">{icon('fas fa-comments')}</span>
          </span>
        </Link>
      </div>
    );

    if (marker === 'brand') {
      return (
        <div className="FlatRateMainLiveChat" data-flatrate-brand-live="true">
          {row}
        </div>
      );
    }

    return (
      <div className="FlatRateMainLiveChat" data-flatrate-main-live="true">
        {row}
      </div>
    );
  }
}
