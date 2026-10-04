import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Dropdown from 'flarum/common/components/Dropdown';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';

/**
 * Compact overflow for the canonical discussion control list.
 * Does not rebuild individual moderation handlers or subscription choices.
 */
export default class DiscussionHeroActionsMenu extends Component {
  view() {
    const discussion = this.attrs.discussion;
    if (!discussion) return null;

    const controls = DiscussionControls.controls(discussion, this.attrs.context).toArray();
    if (!controls.length) return null;

    return (
      <div className="FlatRateDiscussionActions">
        <Dropdown
          icon="fas fa-ellipsis-v"
          className="FlatRateDiscussionActions-menu"
          buttonClassName="Button Button--icon Button--flat"
          accessibleToggleLabel={app.translator.trans('core.forum.discussion_controls.toggle_dropdown_accessible_label')}
        >
          {controls}
        </Dropdown>
      </div>
    );
  }
}
