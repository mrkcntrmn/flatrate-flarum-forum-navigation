import { override } from 'flarum/common/extend';
import TerminalPost from 'flarum/forum/components/TerminalPost';
import humanTime from 'flarum/common/helpers/humanTime';
import username from 'flarum/common/helpers/username';
import icon from 'flarum/common/helpers/icon';

import { showDiscussionActivityTime } from './utils/discussionActivityTime';

/**
 * Compact the native list-row TerminalPost byline, including synthetic MAIN
 * pinned discussion rows. This does not modify discussion/post models, routes,
 * guest policy, or timestamps anywhere outside the discussion list.
 */
export default function registerCompactDiscussionActivity() {
  override(TerminalPost.prototype, 'view', function (original) {
    const discussion = this.attrs && this.attrs.discussion;
    if (!discussion) return original();

    // Preserve Flarum's original first/last-post decision and reply glyph.
    const lastPost = Boolean(this.attrs.lastPost && discussion.replyCount());
    const user = discussion[lastPost ? 'lastPostedUser' : 'user']();
    const time = discussion[lastPost ? 'lastPostedAt' : 'createdAt']();
    const recent = showDiscussionActivityTime(time);

    // Flarum already localizes the "started" phrase correctly. Retain that
    // native markup for recent original posts; compact older rows to username.
    if (!lastPost && recent) return original();

    // For replies, omit only the "replied" verb; show a relative time while
    // newer than 24 hours. Never invent a time when metadata is absent.
    return (
      <span>
        {lastPost ? [icon('fas fa-reply'), ' '] : null}
        {username(user)}
        {lastPost && recent ? [' ', humanTime(time)] : null}
      </span>
    );
  });
}
