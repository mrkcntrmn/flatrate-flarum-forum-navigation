import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';

import {
  formatLiveCountPresentation,
  getLiveMainProvider,
  isLiveMainProviderAvailable,
  resolveMainLiveHref,
} from '../utils/mainLiveChat';
import LiveBoardPin from './LiveBoardPin';

/**
 * Synthetic locked General Live row for authenticated MAIN.
 * Not a Discussion model — consumes app.flatRateLiveMain only.
 */
export default class MainLiveChatPin extends Component {
  oninit(vnode) {
    super.oninit(vnode);
  }

  provider() {
    return this.attrs.provider || getLiveMainProvider(app);
  }

  view() {
    const provider = this.provider();
    if (!isLiveMainProviderAvailable(provider)) {
      return null;
    }

    const href = resolveMainLiveHref(provider);
    let rawCount = null;
    try {
      rawCount = typeof provider.liveCount === 'function' ? provider.liveCount() : null;
    } catch (error) {
      rawCount = null;
    }
    const countInfo = formatLiveCountPresentation(rawCount);
    const liveCount = countInfo.known ? Math.floor(Number(rawCount)) : null;

    return (
      <LiveBoardPin
        href={href}
        count={liveCount}
        countLabel={countInfo.ariaLabel}
        ariaLabel="Open Public Live chat"
        marker="main"
      />
    );
  }
}
