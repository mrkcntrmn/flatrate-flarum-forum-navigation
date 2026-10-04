import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';

import {
  canMutateDiscussionFollow,
  discussionFollowStarPresentation,
  nextDiscussionFollowSubscription,
} from '../utils/discussionFollowState';

/**
 * Phone discussion header Follow control.
 * Uses discussion.subscription() and discussion.save({ subscription }).
 */
export default class DiscussionFollowStar extends Component {
  view() {
    const discussion = this.attrs.discussion;
    if (!discussion || !canMutateDiscussionFollow(app.session && app.session.user)) {
      return null;
    }

    const current = typeof discussion.subscription === 'function' ? discussion.subscription() : null;
    const presentation = discussionFollowStarPresentation(current);

    return (
      <Button
        className={`Button Button--icon Button--flat App-primaryControl FlatRateDiscussionFollowStar ${presentation.followed ? 'FlatRateDiscussionFollowStar--followed' : 'FlatRateDiscussionFollowStar--outline'}`}
        icon={presentation.icon}
        aria-label={presentation.label}
        aria-pressed={presentation.followed ? 'true' : 'false'}
        onclick={() => {
          const next = nextDiscussionFollowSubscription(current);
          discussion.save({ subscription: next });
        }}
      />
    );
  }
}
