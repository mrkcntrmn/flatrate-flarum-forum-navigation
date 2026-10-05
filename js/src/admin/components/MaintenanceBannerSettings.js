import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Switch from 'flarum/common/components/Switch';

import {
  DEFAULT_MESSAGE,
  MAINTENANCE_BANNER_COLORS,
  SETTING_COLOR,
  SETTING_ENABLED,
  SETTING_MESSAGE,
  SETTING_REVISION,
  normalizeColor,
  normalizeSettingBool,
} from '../../common/maintenanceBannerSettings';

const MAX_MESSAGE_LENGTH = 280;

export default class MaintenanceBannerSettings extends Component {
  oninit(vnode) {
    super.oninit(vnode);

    const settings = (app.data && app.data.settings) || {};
    this.enabled = normalizeSettingBool(settings[SETTING_ENABLED], true);
    this.message =
      settings[SETTING_MESSAGE] === undefined || settings[SETTING_MESSAGE] === null
        ? DEFAULT_MESSAGE
        : String(settings[SETTING_MESSAGE]);
    this.color = normalizeColor(settings[SETTING_COLOR]);
    this.saving = false;
    this.status = '';
    this.statusKind = '';
  }

  view() {
    return (
      <div className="FlatRateMaintenanceBannerAdmin Form-group">
        <h2>{app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.heading')}</h2>
        <p className="helpText">
          {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.intro_help')}
        </p>

        <div className="Form-group">
          <Switch
            state={this.enabled}
            disabled={this.saving}
            onchange={(value) => {
              this.enabled = !!value;
            }}
          >
            {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.enabled_label')}
          </Switch>
        </div>

        <div className="Form-group">
          <label htmlFor="flatrate-maintenance-banner-message">
            {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.message_label')}
          </label>
          <textarea
            id="flatrate-maintenance-banner-message"
            className="FormControl"
            rows="3"
            maxlength={MAX_MESSAGE_LENGTH}
            disabled={this.saving}
            value={this.message}
            oninput={(event) => {
              this.message = event.target.value;
            }}
          />
          <p className="helpText">
            {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.message_help', {
              max: MAX_MESSAGE_LENGTH,
            })}
          </p>
        </div>

        <div className="Form-group">
          <label htmlFor="flatrate-maintenance-banner-color">
            {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.color_label')}
          </label>
          <select
            id="flatrate-maintenance-banner-color"
            className="FormControl"
            disabled={this.saving}
            value={this.color}
            onchange={(event) => {
              this.color = normalizeColor(event.target.value);
            }}
          >
            {MAINTENANCE_BANNER_COLORS.map((option) => (
              <option value={option.value}>{option.label}</option>
            ))}
          </select>
          <p className="helpText">
            {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.color_help')}
          </p>
        </div>

        <Button className="Button Button--primary" loading={this.saving} disabled={this.saving} onclick={() => this.save()}>
          {app.translator.trans('flatrate-forum-navigation.admin.maintenance_banner.save_button')}
        </Button>

        {this.status ? (
          <p className={this.statusKind === 'error' ? 'helpText Alert Alert--error' : 'helpText'}>
            {this.status}
          </p>
        ) : null}
      </div>
    );
  }

  save() {
    if (this.saving) return;

    const message = String(this.message || '').trim();
    if (this.enabled && !message) {
      this.statusKind = 'error';
      this.status = app.translator.trans(
        'flatrate-forum-navigation.admin.maintenance_banner.message_required'
      );
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      this.statusKind = 'error';
      this.status = app.translator.trans(
        'flatrate-forum-navigation.admin.maintenance_banner.message_too_long',
        { max: MAX_MESSAGE_LENGTH }
      );
      return;
    }

    const color = normalizeColor(this.color);
    const revision = `r${Date.now().toString(36)}`;
    const body = {
      [SETTING_ENABLED]: this.enabled ? '1' : '0',
      [SETTING_MESSAGE]: message,
      [SETTING_COLOR]: color,
      [SETTING_REVISION]: revision,
    };

    this.saving = true;
    this.status = '';
    this.statusKind = '';
    m.redraw();

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/settings`,
        body,
      })
      .then(() => {
        Object.assign(app.data.settings, body);
        this.message = message;
        this.color = color;
        this.saving = false;
        this.statusKind = 'success';
        this.status = app.translator.trans(
          'flatrate-forum-navigation.admin.maintenance_banner.save_success'
        );
        m.redraw();
      })
      .catch(() => {
        this.saving = false;
        this.statusKind = 'error';
        this.status = app.translator.trans(
          'flatrate-forum-navigation.admin.maintenance_banner.save_error'
        );
        m.redraw();
      });
  }
}
