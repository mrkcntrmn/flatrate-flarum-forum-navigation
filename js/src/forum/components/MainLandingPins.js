import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import {
  mainPinIdsFromForum,
  orderDiscussionsByConfiguredIds,
} from '../utils/mainLandingPins';

/**
 * Curated MAIN pin rows. Uses normal DiscussionListItem language — not a
 * separate promotional card system. Never grants visibility; server filters
 * already narrowed to actor-visible discussions.
 */
export default class MainLandingPins extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
    this.discussions = [];
    this.load();
  }

  view() {
    if (this.loading) {
      return (
        <div className="FlatRateMainLandingPins FlatRateMainLandingPins--loading" aria-busy="true">
          <LoadingIndicator />
        </div>
      );
    }

    if (!this.discussions.length) {
      return null;
    }

    const params = (app.search && typeof app.search.params === 'function' && app.search.params()) || {};

    return (
      <div className="FlatRateMainLandingPins" data-audience={this.attrs.audience}>
        <ul className="DiscussionList FlatRateMainLandingPins-list">
          {this.discussions.map((discussion) => (
            <li key={discussion.id()} data-id={discussion.id()} className="DiscussionList-item FlatRateMainLandingPins-item">
              <DiscussionListItem discussion={discussion} params={params} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  load() {
    const audience = this.attrs.audience === 'public' ? 'public' : 'member';
    const configuredIds = mainPinIdsFromForum(app.forum, audience);

    if (!configuredIds.length) {
      this.loading = false;
      this.discussions = [];
      return;
    }

    app.store
      .find('discussions', {
        filter: { flatrateMainPins: audience },
        include: 'user,lastPostedUser',
        page: { limit: Math.max(configuredIds.length, 1) },
      })
      .then((models) => {
        const list = Array.isArray(models) ? models : models ? [models] : [];
        this.discussions = orderDiscussionsByConfiguredIds(list, configuredIds);
        this.loading = false;
        m.redraw();
      })
      .catch(() => {
        this.discussions = [];
        this.loading = false;
        m.redraw();
      });
  }
}
