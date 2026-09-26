import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

import {
  formatLiveCountPresentation,
  getLiveMainProvider,
  isLiveMainProviderAvailable,
  readUserLive,
  resolveMainLiveHref,
} from '../utils/mainLiveChat';

/**
 * Synthetic locked General Live row for authenticated MAIN.
 * Not a Discussion model — consumes app.flatRateLiveMain only.
 */
export default class MainLiveChatPin extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.busy = false;
  }

  provider() {
    return this.attrs.provider || getLiveMainProvider(app);
  }

  toggleLive(event, provider, nextValue) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!provider || typeof provider.setUserLive !== 'function' || this.busy) {
      return;
    }

    this.busy = true;
    Promise.resolve(provider.setUserLive(nextValue))
      .catch(() => {
        // Provider/admin denial — fail closed; preference may still be stored.
      })
      .finally(() => {
        this.busy = false;
        if (typeof m !== 'undefined' && m.redraw) {
          m.redraw();
        }
      });
  }

  view() {
    const provider = this.provider();
    if (!isLiveMainProviderAvailable(provider)) {
      return null;
    }

    const href = resolveMainLiveHref(provider);
    let count = null;
    try {
      count = typeof provider.liveCount === 'function' ? provider.liveCount() : null;
    } catch (error) {
      count = null;
    }
    const countInfo = formatLiveCountPresentation(count);
    const userLive = readUserLive(provider);

    return (
      <div className="FlatRateMainLiveChat" data-flatrate-main-live="true">
        <div className="FlatRateMainLiveChat-row">
          <Link
            className="FlatRateMainLiveChat-link"
            href={href}
            aria-label="Open FlatRate.wiki General Live"
          >
            <span className="FlatRateMainLiveChat-icon" aria-hidden="true">
              {icon('fas fa-comments')}
            </span>
            <span className="FlatRateMainLiveChat-body">
              <span className="FlatRateMainLiveChat-title">FlatRate.wiki</span>
              <span className="FlatRateMainLiveChat-meta">
                <span className="FlatRateMainLiveChat-public" aria-hidden="true">
                  PUBLIC 🌐
                </span>
                <span className="FlatRateMainLiveChat-count" aria-label={countInfo.ariaLabel}>
                  {countInfo.text}
                </span>
              </span>
            </span>
          </Link>

          <button
            type="button"
            role="switch"
            className={
              'FlatRateMainLiveChat-toggle' + (userLive ? ' FlatRateMainLiveChat-toggle--on' : '')
            }
            aria-checked={userLive ? 'true' : 'false'}
            aria-label="Keep me live while browsing"
            disabled={this.busy}
            onclick={(event) => this.toggleLive(event, provider, !userLive)}
          >
            <span className="FlatRateMainLiveChat-toggleLabel" aria-hidden="true">
              LIVE
            </span>
          </button>
        </div>
      </div>
    );
  }
}
