import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';

import LiveBoardPin from './LiveBoardPin';
import { activateBrandLive, getLiveBoardProvider } from '../utils/brandLivePin';

/**
 * One synthetic Live row on the current canonical Brand board.
 */
export default class BrandLivePin extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.activate();
  }

  onremove(vnode) {
    super.onremove(vnode);
    this.deactivate();
  }

  board() {
    return this.attrs.board || null;
  }

  provider() {
    return this.attrs.provider || getLiveBoardProvider(app);
  }

  activate() {
    activateBrandLive(this.board(), this.provider());
  }

  deactivate() {
    const board = this.board();
    const provider = this.provider();
    if (!board?.boardKey || !provider || typeof provider.deactivate !== 'function') return;
    provider.deactivate(board.boardKey);
  }

  view() {
    const board = this.board();
    const provider = this.provider();
    if (!board?.boardKey || !provider || provider.available(board.boardKey) !== true) {
      return null;
    }
    const href = typeof provider.href === 'function' ? provider.href(board.boardKey) : null;
    if (!href) return null;
    const rawCount = typeof provider.liveCount === 'function' ? provider.liveCount(board.boardKey) : null;
    const name = board.name || 'Brand';

    return (
      <LiveBoardPin
        href={href}
        count={rawCount}
        countLabel={rawCount == null ? 'Live presence count unavailable' : `${rawCount} members live`}
        ariaLabel={`Open ${name} Public Live chat`}
        marker="brand"
      />
    );
  }
}
