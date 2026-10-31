import assert from 'node:assert/strict';
import test from 'node:test';
import { hasItem, itemKeys } from '../src/forum/utils/itemList.js';

test('Flarum 2 ItemList works through its public API without a legacy items property', () => {
  const list = { has: (key) => key === 'discussionList', toObject: () => ({ discussionList: {}, hero: {} }) };
  assert.equal(hasItem(list, 'discussionList'), true);
  assert.equal(hasItem(list, 'missing'), false);
  assert.deepEqual(itemKeys(list), ['discussionList', 'hero']);
});

test('empty lists and legacy fixtures remain safe', () => {
  assert.equal(hasItem(null, 'missing'), false);
  assert.deepEqual(itemKeys(null), []);
  assert.equal(hasItem({ items: { hero: {} } }, 'hero'), true);
});
