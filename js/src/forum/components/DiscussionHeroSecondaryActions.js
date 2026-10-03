import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';

const SUBSCRIPTION_CHOICES = [
  { value: null, label: 'Not following' },
  { value: 'follow', label: 'Following' },
  { value: 'ignore', label: 'Ignore discussion' },
];

/**
 * Expanded-hero notification state plus the canonical discussion control list.
 * Does not rebuild individual moderation handlers.
 */
export default class DiscussionHeroSecondaryActions extends Component {
  view() {
    const discussion = this.attrs.discussion;
    if (!discussion) return null;

    const subscription = typeof discussion.subscription === 'function' ? discussion.subscription() : null;
    const controls =
      this.attrs.includeControls === false
        ? []
        : DiscussionControls.controls(discussion, this.attrs.context).toArray();

    return (
      <div className="FlatRateDiscussionHeroSecondary">
        {this.attrs.includeNotifications === false ? null : (
          <div className="FlatRateDiscussionNotifications">
            <div className="FlatRateDiscussionNotifications-label">Notifications</div>
            <div className="FlatRateDiscussionNotifications-choices" role="group" aria-label="Notifications">
              {SUBSCRIPTION_CHOICES.map((choice) => {
                const selected = subscription === choice.value || (choice.value === null && !subscription);
                return (
                  <Button
                    key={choice.label}
                    className={`Button FlatRateDiscussionNotifications-choice ${selected ? 'FlatRateDiscussionNotifications-choice--selected' : ''}`}
                    aria-pressed={selected ? 'true' : 'false'}
                    onclick={() => discussion.save({ subscription: choice.value })}
                  >
                    {choice.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
        <div className="FlatRateDiscussionActions">
          <div className="FlatRateDiscussionActions-label">Discussion actions</div>
          <ul className="FlatRateDiscussionActions-list">{controls}</ul>
        </div>
      </div>
    );
  }
}
