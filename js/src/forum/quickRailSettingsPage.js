import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import SettingsPage from 'flarum/forum/components/SettingsPage';

import QuickRailPreferenceControl from './components/QuickRailPreferenceControl';
import {
  getQuickRailAdminConfig,
  shouldShowQuickRailPreferenceControl,
} from './utils/quickRailVisibility';

app.initializers.add(
  'flatrate-forum-navigation-quick-rail-settings',
  () => {
    extend(SettingsPage.prototype, 'settingsItems', function (items) {
      const config = getQuickRailAdminConfig(app.forum);
      if (!shouldShowQuickRailPreferenceControl(config)) {
        return;
      }

      const user = this.user;
      if (!user || !app.session || user !== app.session.user) {
        return;
      }

      items.add('flatrateQuickRail', <QuickRailPreferenceControl user={user} />, -10);
    });
  },
  -50
);
