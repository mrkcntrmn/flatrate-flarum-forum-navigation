#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const forumLess = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const homeLess = readFileSync(join(root, 'resources/less/drawer-home.less'), 'utf8');
const extendPhp = readFileSync(join(root, 'extend.php'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));

test('phone hamburger adds MAIN with a warehouse icon before the brand tree', () => {
  assert.match(indexSrc, /flatrateDrawerHome/);
  assert.match(indexSrc, /FlatRateDrawerHome-link/);
  assert.match(indexSrc, /href=\{app\.route\('index'\)\}/);
  assert.match(indexSrc, /icon="fas fa-warehouse"/);
  assert.match(indexSrc, />\s*MAIN\s*<\/LinkButton>/);
  assert.doesNotMatch(indexSrc, />\s*HOME\s*<\/LinkButton>/);

  const homePosition = indexSrc.indexOf("'flatrateDrawerHome'");
  const navPosition = indexSrc.indexOf("'flatrateDrawerNav'");
  assert.ok(homePosition >= 0 && navPosition >= 0 && homePosition < navPosition);
  assert.match(indexSrc, /'flatrateDrawerHome',[\s\S]*?\n\s*-19\n/);
  assert.match(indexSrc, /'flatrateDrawerNav',[\s\S]*?\n\s*-20\n/);
});

test('existing divider remains between MAIN and Acura', () => {
  const brands = manifest.groups.find((group) => group.id === 'brands');
  assert.equal(brands?.boards?.[0]?.name, 'Acura');
  assert.match(forumLess, /\.App-drawer \.item-flatrateDrawerNav\s*\{[\s\S]*?border-top:\s*1px solid/);
  assert.doesNotMatch(homeLess, /item-flatrateDrawerHome[\s\S]*?border-top/);
});

test('MAIN drawer action is phone-only and its LESS is registered', () => {
  assert.match(homeLess, /@media \(max-width: 767px\)/);
  assert.match(homeLess, /\.App-drawer \.item-flatrateDrawerHome/);
  assert.match(homeLess, /@media \(min-width: 768px\)[\s\S]*?\.item-flatrateDrawerHome\s*\{\s*display:\s*none\s*!important;/);
  assert.match(extendPhp, /drawer-home\.less/);
});
