import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Switch from 'flarum/common/components/Switch';

import {
  SETTING_V2_ADMIN_VISIBLE,
  SETTING_V2_USER_VISIBLE,
  normalizeSettingBool,
} from '../../forum/utils/quickRailVisibility';

const FIELDS = [
  {
    key: SETTING_V2_ADMIN_VISIBLE,
    missingDefault: false,
    label: 'flatrate-forum-navigation.admin.quick_rail.admin_v2_label',
    help: 'flatrate-forum-navigation.admin.quick_rail.admin_v2_help',
  },
  {
    key: SETTING_V2_USER_VISIBLE,
    missingDefault: false,
    label: 'flatrate-forum-navigation.admin.quick_rail.user_v2_label',
    help: 'flatrate-forum-navigation.admin.quick_rail.user_v2_help',
  },
];

export default class QuickRailSettings extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.savingKey = '';
    this.pending = {};
    this.status = '';
  }

  view() {
    return (
      <div className="FlatRateQuickRailAdmin">
        <h3>{app.translator.trans('flatrate-forum-navigation.admin.quick_rail.heading')}</h3>
        <p className="helpText">
          {app.translator.trans('flatrate-forum-navigation.admin.quick_rail.intro_help')}
        </p>
        {FIELDS.map((field) => this.field(field))}
        {this.status ? <p className="helpText">{this.status}</p> : null}
      </div>
    );
  }

  field(field) {
    const stored = this.pending[field.key] !== undefined ? this.pending[field.key] : this.read(field);

    return (
      <div className="Form-group" key={field.key}>
        <Switch
          state={stored}
          loading={this.savingKey === field.key}
          onchange={(value) => this.save(field.key, value)}
        >
          {app.translator.trans(field.label)}
        </Switch>
        <p className="helpText">{app.translator.trans(field.help)}</p>
      </div>
    );
  }

  read(field) {
    const settings = (app.data && app.data.settings) || {};
    return normalizeSettingBool(settings[field.key], field.missingDefault);
  }

  save(key, value) {
    if (this.savingKey) {
      return;
    }

    const previous = (app.data && app.data.settings && app.data.settings[key]) || undefined;
    const stored = value ? '1' : '0';
    this.savingKey = key;
    this.pending[key] = !!value;
    this.status = '';
    m.redraw();

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/settings`,
        body: { [key]: stored },
      })
      .then(() => {
        app.data.settings[key] = stored;
        delete this.pending[key];
        this.savingKey = '';
        m.redraw();
      })
      .catch(() => {
        if (previous === undefined) {
          delete app.data.settings[key];
        } else {
          app.data.settings[key] = previous;
        }
        delete this.pending[key];
        this.savingKey = '';
        this.status = app.translator.trans('flatrate-forum-navigation.admin.quick_rail.save_error');
        m.redraw();
      });
  }
}
