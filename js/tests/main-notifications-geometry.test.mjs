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

function selectorBody(selector) {
  const escaped = selector.replace(/[.*+?^$\\{}()|[\]\\]/g, '\\$&');
  const match = less.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(match, 'missing CSS selector: ' + selector);
  return match[1];
}

function luminance(hex) {
  const values = hex.match(/[a-f0-9]{2}/gi).map((segment) => parseInt(segment, 16) / 255);
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

test('idle plane contrast: white and lime stay legible on the white forum header', () => {
  const button = selectorBody('.FlatRateMainNotifications.App-primaryControl');
  const idlePlane = selectorBody('.FlatRateMainNotifications .FlatRateMainNotifications-plane');
  const unreadPlane = selectorBody('.FlatRateMainNotifications--unread .FlatRateMainNotifications-plane');
  const background = button.match(/background-color:\\s*(#[a-f0-9]{6})/i)?.[1];
  const white = idlePlane.match(/color:\\s*(#[a-f0-9]{6})/i)?.[1];
  const lime = unreadPlane.match(/color:\\s*(#[a-f0-9]{6})/i)?.[1];
  assert.ok(background, 'Notifications button needs a dark contrast surface');
  assert.equal(white?.toLowerCase(), '#ffffff');
  assert.equal(lime?.toLowerCase(), '#84cc16');
  assert.match(button, /border-radius:\\s*50%/);
  assert.ok(contrast(white, background) >= 4.5, 'idle white plane needs 4.5:1 visual contrast');
  assert.ok(contrast(lime, background) >= 4.5, 'unread lime plane needs 4.5:1 visual contrast');
  assert.ok(contrast(background, '#ffffff') >= 4.5, 'dark button must contrast with white header');
});
