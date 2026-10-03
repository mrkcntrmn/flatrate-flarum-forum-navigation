#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');

function technicianWrenchRule() {
  const start = less.indexOf('.App-titleControl.FlatRatePresentationTitle--technician > .Dropdown-toggle > .icon.fa-wrench');
  assert.ok(start > 0);
  return less.slice(start, less.indexOf('}', start));
}

test('technician wrench is removed from label width flow', () => {
  const rule = technicianWrenchRule();
  assert.match(rule, /position:\s*absolute\s*!important/);
  assert.match(rule, /right:\s*100%/);
  assert.match(rule, /left:\s*auto/);
  assert.match(rule, /margin-right:\s*0\.35rem/);
  assert.doesNotMatch(rule, /margin:\s*0\s+0\.35rem\s+0\s+0/);
  assert.match(less, /\.App-titleControl > \.Dropdown-toggle\s*\{[^}]*position:\s*relative/s);
  assert.match(less, /\.Button-caret\s*\{[^}]*left:\s*100%/s);
});
