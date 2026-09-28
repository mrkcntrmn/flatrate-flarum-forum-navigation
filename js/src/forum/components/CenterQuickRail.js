import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Button from 'flarum/common/components/Button';
import avatar from 'flarum/common/helpers/avatar';
import icon from 'flarum/common/helpers/icon';
import extractText from 'flarum/common/utils/extractText';
import classList from 'flarum/common/utils/classList';

import { technicianTopicsHref } from '../utils/manifest';
import { TECHNICIAN_TOPICS_ICON } from '../utils/startNav';
import {
  effectiveMemberQuickRailVisible,
  quickRailControlIds,
} from '../utils/quickRailVisibility';
import { closeCenterSheetFrom, openCanonicalNewDiscussion } from '../utils/openCanonicalNewDiscussion';

function railLabel(key) {
  return extractText(app.translator.trans(`flatrate-forum-navigation.forum.quick_rail.${key}`));
}

function messagesHref() {
  if (app.routes && app.routes['flatrate-messaging.index']) {
    return app.route('flatrate-messaging.index');
  }

  return '/messages';
}

export default class CenterQuickRail extends Component {
  static isListItem = true;

  view() {
    const user = app.session && app.session.user;
    const signedIn = !!user;
    const memberVisible = signedIn && effectiveMemberQuickRailVisible({ forum: app.forum, user });
    const ids = quickRailControlIds({ signedIn, memberVisible });

    if (!ids.length) {
      return null;
    }

    const guest = !signedIn;

    return (
      <li className="item-flatrateQuickRail">
        <div
          className={classList('FlatRateCenterQuickRail', {
            'FlatRateCenterQuickRail--guest': guest,
            'FlatRateCenterQuickRail--member': !guest,
          })}
          role="navigation"
          aria-label={extractText(app.translator.trans('flatrate-forum-navigation.forum.quick_rail.region'))}
          data-quick-rail-order={ids.join(',')}
        >
          {ids.map((id) => this.control(id, user))}
        </div>
      </li>
    );
  }

  control(id, user) {
    const label = railLabel(id);

    if (id === 'profile') {
      return (
        <Link
          className="FlatRateCenterQuickRail-control"
          href={app.route.user(user)}
          aria-label={label}
          title={label}
          data-quick-rail-control="profile"
          onclick={(event) => closeCenterSheetFrom(event.currentTarget)}
        >
          {avatar(user, { title: false, alt: '' })}
        </Link>
      );
    }

    if (id === 'messages') {
      return (
        <Link
          className="FlatRateCenterQuickRail-control"
          href={messagesHref()}
          aria-label={label}
          title={label}
          data-quick-rail-control="messages"
          onclick={(event) => closeCenterSheetFrom(event.currentTarget)}
        >
          {icon('fas fa-paper-plane')}
        </Link>
      );
    }

    if (id === 'new_discussion') {
      const canStart = !!(app.forum.attribute('canStartDiscussion') || !user);

      return (
        <Button
          className="Button Button--icon FlatRateCenterQuickRail-control"
          icon="fas fa-plus"
          aria-label={label}
          title={label}
          data-quick-rail-control="new_discussion"
          disabled={!canStart}
          onclick={(event) => {
            closeCenterSheetFrom(event.currentTarget);
            if (!canStart) return;
            openCanonicalNewDiscussion(this.attrs.page).catch(() => {});
          }}
        />
      );
    }

    if (id === 'technician_topics') {
      return (
        <Link
          className="FlatRateCenterQuickRail-control"
          href={technicianTopicsHref(this.attrs.manifest)}
          aria-label={label}
          title={label}
          data-quick-rail-control="technician_topics"
          onclick={(event) => closeCenterSheetFrom(event.currentTarget)}
        >
          {icon(TECHNICIAN_TOPICS_ICON)}
        </Link>
      );
    }

    return (
      <Link
        className="FlatRateCenterQuickRail-control"
        href={app.route('index')}
        aria-label={label}
        title={label}
        data-quick-rail-control="main"
        onclick={(event) => closeCenterSheetFrom(event.currentTarget)}
      >
        {icon('fas fa-warehouse')}
      </Link>
    );
  }
}
