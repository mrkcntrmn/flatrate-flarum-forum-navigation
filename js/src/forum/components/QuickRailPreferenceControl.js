import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Switch from 'flarum/common/components/Switch';
import extractText from 'flarum/common/utils/extractText';

import {
  PREFERENCE_VISIBLE,
  displayedQuickRailPreference,
  getExplicitQuickRailPreference,
  getQuickRailAdminConfig,
  restoreQuickRailPreference,
  shouldShowQuickRailPreferenceControl,
  snapshotQuickRailPreference,
} from '../utils/quickRailVisibility';

export default class QuickRailPreferenceControl extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.saving = false;
    this.pending = undefined;
    this.error = '';
  }

  view() {
    const user = this.attrs.user;
    const config = getQuickRailAdminConfig(app.forum);

    if (!shouldShowQuickRailPreferenceControl(config) || !user) {
      return null;
    }

    const explicit = getExplicitQuickRailPreference(user);
    const checked =
      this.saving && this.pending !== undefined
        ? this.pending
        : displayedQuickRailPreference({
            explicit,
            memberDefaultVisible: config.memberDefaultVisible,
          });

    return (
      <div className="Form-group FlatRateQuickRailPreference">
        <Switch
          state={checked}
          loading={this.saving}
          onchange={(value) => this.save(value)}
        >
          {app.translator.trans('flatrate-forum-navigation.forum.settings.quick_rail_label')}
        </Switch>
        <p className="helpText">
          {app.translator.trans('flatrate-forum-navigation.forum.settings.quick_rail_help')}
        </p>
        {this.error ? <p className="helpText FlatRateQuickRailPreference-error">{this.error}</p> : null}
      </div>
    );
  }

  save(next) {
    if (this.saving) {
      return;
    }

    const user = this.attrs.user;
    if (!user || typeof user.savePreferences !== 'function') {
      return;
    }

    const snapshot = snapshotQuickRailPreference(user);
    this.saving = true;
    this.pending = !!next;
    this.error = '';
    m.redraw();

    user
      .savePreferences({ [PREFERENCE_VISIBLE]: !!next })
      .then(() => {
        this.saving = false;
        this.pending = undefined;
        m.redraw();
      })
      .catch(() => {
        restoreQuickRailPreference(user, snapshot);
        this.saving = false;
        this.pending = undefined;
        this.error = extractText(
          app.translator.trans('flatrate-forum-navigation.forum.settings.quick_rail_save_error')
        );
        m.redraw();
      });
  }
}
