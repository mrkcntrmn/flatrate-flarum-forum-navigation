import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const common = readFileSync(join(root, 'js/src/common/maintenanceBannerSettings.js'), 'utf8');
const admin = readFileSync(join(root, 'js/src/admin/components/MaintenanceBannerSettings.js'), 'utf8');
const forum = readFileSync(join(root, 'js/src/forum/maintenanceBanner.js'), 'utf8');
const adminIndex = readFileSync(join(root, 'js/src/admin/index.js'), 'utf8');
const forumIndex = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const adminDist = readFileSync(join(root, 'js/dist/admin.js'), 'utf8');
const forumDist = readFileSync(join(root, 'js/dist/forum.js'), 'utf8');

test('maintenance banner admin contract is wired through tracked source and dist', () => {
  for (const key of [
    'maintenance_banner_enabled',
    'maintenance_banner_message',
    'maintenance_banner_color',
    'maintenance_banner_revision',
  ]) {
    assert.match(common, new RegExp(key));
    assert.match(adminDist, new RegExp(key));
  }

  assert.match(admin, /MAX_MESSAGE_LENGTH = 280/);
  assert.match(admin, /Date\.now\(\)\.toString\(36\)/);
  assert.match(adminIndex, /MaintenanceBannerSettings/);
  assert.match(adminDist, /FLATRATE\.WIKI Pink/);
});

test('maintenance banner public runtime is settings-driven and dismissible', () => {
  assert.match(forum, /flatrateMaintenanceBanner/);
  assert.match(forum, /textContent = config\.message/);
  assert.match(forum, /localStorage\.setItem\(storageKey, 'dismissed'\)/);
  assert.match(forumIndex, /extend\(ForumApplication\.prototype, 'mount'/);
  assert.match(forumIndex, /applyMaintenanceBanner\(app\)/);
  assert.match(forumDist, /flatrateMaintenanceBanner/);
});
