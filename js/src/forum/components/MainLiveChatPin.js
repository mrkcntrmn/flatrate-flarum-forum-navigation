import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import {
  formatLiveCountPresentation,
  getLiveMainProvider,
  isLiveMainProviderAvailable,
  resolveMainLiveHref,
} from '../utils/mainLiveChat';

/**
 * Synthetic locked General Live row for authenticated MAIN.
 * Not a Discussion model — consumes app.flatRateLiveMain only.
 */
export default class MainLiveChatPin extends Component {
  view() {
    const provider = this.provider();
    if (!isLiveMainProviderAvailable(provider)) {
      return null;
    }

    const href = resolveMainLiveHref(provider);
    return (
      <div className="FlatRateMainLiveChat" data-flatrate-main-live="true">
        <div className="FlatRateMainLiveChat-row">
          <Link
            className="FlatRateMainLiveChat-link"
            href={href}
            aria-label="Open Public Live chat"
          >
            <span className="FlatRateMainLiveChat-status" aria-hidden="true">
              <span>PUBLIC</span>
              <i className="fas fa-globe FlatRateMainLiveChat-globe" />
              <span>LIVE</span>
              {liveCount !== null ? (
                <span className="FlatRateMainLiveChat-count" aria-label={countInfo.ariaLabel}>
                  {liveCount}
                </span>
              ) : null}
              <span className="FlatRateMainLiveChat-icon">
                {icon('fas fa-comments')}
              </span>
            </span>
          </Link>
        </div>
      </div>
    );
  }
}
