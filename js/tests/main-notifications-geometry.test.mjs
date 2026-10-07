#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { REQUIRED_HEADER_WIDTHS, mainHeaderGeometry } from '../src/forum/utils/mainNotifications.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

test('plane target stays 44px at the required phone widths', () => {
  for (const width of REQUIRED_HEADER_WIDTHS) {
    const geometry = mainHeaderGeometry(width);
    assert.equal(geometry.pass, true, String(width));
    assert.equal(geometry.plane, 44);
  }
  assert.equal(mainHeaderGeometry(360).pass, true);
  assert.equal(mainHeaderGeometry(390).pass, true);
  assert.equal(mainHeaderGeometry(412).pass, true);
  assert.match(less, /\.FlatRateMainNotifications\.App-primaryControl[\s\S]*min-width:\s*44px/);
  assert.match(less, /\.FlatRateMainNotifications\.App-primaryControl[\s\S]*min-height:\s*44px/);
});
