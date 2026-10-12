#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const livePin = readFileSync(join(root, 'js/src/forum/components/LiveBoardPin.js'), 'utf8');
const brandPin = readFileSync(join(root, 'js/src/forum/components/BrandLivePin.js'), 'utf8');
const mainPin = readFileSync(join(root, 'js/src/forum/components/MainLiveChatPin.js'), 'utf8');

test('MAIN and Brand Live share one pink chat-bubbles glyph', () => {
  assert.match(livePin, /FlatRateMainLiveChat-bubbles/);
  assert.match(mainPin, /<LiveBoardPin/);
  assert.match(brandPin, /<LiveBoardPin/);
  assert.match(css, /\.FlatRateMainLiveChat-bubbles\s*\{[^}]*color:\s*#c72d5d;/s);
});

test('branding changes the bubble, not the lime PUBLIC/LIVE/globe status', () => {
  assert.match(css, /\.FlatRateMainLiveChat-status\s*\{[^}]*color:\s*#66ff00;/s);
  assert.match(css, /\.FlatRateMainLiveChat-globe\s*\{[^}]*color:\s*#66ff00;/s);
  assert.match(css, /\.FlatRateMainLiveChat-title\s*\{[^}]*color:\s*#ffffff;/s);
});
