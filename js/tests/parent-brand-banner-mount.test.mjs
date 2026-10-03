#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

test('TagHero compat is resolved inside the initializer, not at module evaluation', () => {
  const initializerAt = indexSrc.indexOf("app.initializers.add(");
  assert.ok(initializerAt > 0);

  const beforeInitializer = indexSrc.slice(0, initializerAt);
  assert.match(beforeInitializer, /function resolveTagHeroCompat\(/);
  assert.doesNotMatch(beforeInitializer, /let TagHero/);
  assert.doesNotMatch(beforeInitializer, /TagHero = null/);

  const resolverStart = beforeInitializer.indexOf('function resolveTagHeroCompat(');
  const resolver = beforeInitializer.slice(resolverStart, beforeInitializer.indexOf('\n}\n', resolverStart) + 2);
  assert.match(resolver, /require\('flarum\/tags\/components\/TagHero'\)/);
  assert.equal(beforeInitializer.replace(resolver, '').includes("require('flarum/tags/components/TagHero')"), false);

  const initializer = indexSrc.slice(initializerAt);
  assert.match(initializer, /resolveTagHeroCompat\(\)/);
  assert.match(initializer, /extend\(TagHero\.prototype, 'view'/);
  assert.doesNotMatch(initializer, /require\('flarum\/tags\/components\/TagHero'\)/);
});
