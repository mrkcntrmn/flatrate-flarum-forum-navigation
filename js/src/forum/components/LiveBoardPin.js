import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';

import { visibleLiveCount } from '../utils/mainLiveChat';

/**
 * Shared title-over-status Live pin: room title above PUBLIC globe LIVE count.
 * Not a Discussion. Callers own rollout and routing.
 *
 * The globe is a card-center anchor (absolute, left 50%), not a flex sibling
 * of PUBLIC and LIVE. Those labels occupy side slots and cannot shift it.
 */
export default class LiveBoardPin extends Component {
  view() {
    const { href, title, count, countLabel, ariaLabel, marker } = this.attrs;
    const shownCount = visibleLiveCount(count);
    const row = (
      <div className="FlatRateMainLiveChat-row">
        <Link className="FlatRateMainLiveChat-link" href={href} aria-label={ariaLabel}>
          <span className="FlatRateMainLiveChat-heading">
            <span className="FlatRateMainLiveChat-titleGroup">
              <span className="FlatRateMainLiveChat-title">{title}</span>
              <i className="fas fa-comments FlatRateMainLiveChat-bubbles" aria-hidden="true" />
            </span>
          </span>
          <span className="FlatRateMainLiveChat-status" aria-hidden="true">
            <span className="FlatRateMainLiveChat-public">PUBLIC</span>
            <i className="fas fa-globe FlatRateMainLiveChat-globe" aria-hidden="true" />
            <span className="FlatRateMainLiveChat-live">
              <span>LIVE</span>
              {shownCount != null ? (
                <span className="FlatRateMainLiveChat-count" aria-label={countLabel}>
                  {String(shownCount)}
                </span>
              ) : null}
            </span>
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
