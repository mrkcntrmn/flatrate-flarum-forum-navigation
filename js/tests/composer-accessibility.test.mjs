import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/forum/composerAccessibility.js', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '').replace('export default function', 'function');
const hooks = {};
const context = {
  app: { translator: { trans: () => 'Post content' } }, TextEditor: { prototype: {} },
  extractText: (value) => value?.children?.join('') || value || '',
  extend: (_, method, callback) => { hooks[method] = callback; },
};
vm.runInNewContext(source + '\nregisterComposerAccessibility();', context);

test('icon-only submit retains the native translated action name and existing custom labels', () => {
  const submit = { attrs: {} };
  hooks.controlItems.call({ attrs: { submitLabel: { children: ['Post Reply'] } } }, { get: () => submit });
  assert.equal(submit.attrs['aria-label'], 'Post Reply');
  submit.attrs['aria-label'] = 'Custom action';
  hooks.controlItems.call({ attrs: { submitLabel: 'Post Discussion' } }, { get: () => submit });
  assert.equal(submit.attrs['aria-label'], 'Custom action');
});

test('basic editor gets an accessible content name without altering draft or custom editor behavior', () => {
  const attrs = {};
  const input = { tagName: 'TEXTAREA', value: 'Saved draft', hasAttribute: (key) => key in attrs, setAttribute: (key, value) => { attrs[key] = value; } };
  hooks.onbuild.call({ attrs: { composer: { editor: { el: input } }, placeholder: '' } });
  assert.equal(attrs['aria-label'], 'Post content');
  assert.equal(input.value, 'Saved draft');
  attrs['aria-label'] = 'Existing editor name';
  hooks.onbuild.call({ attrs: { composer: { editor: { el: input } }, placeholder: 'Different label' } });
  assert.equal(attrs['aria-label'], 'Existing editor name');
  assert.doesNotThrow(() => hooks.onbuild.call({ attrs: { composer: { editor: {} } } }));
});
