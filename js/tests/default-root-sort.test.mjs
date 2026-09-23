#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ROOT_SORT,
  isRootDiscussionPath,
  withDefaultRootSort,
  withRootSortOrder,
} from '../src/forum/utils/defaultRootSort.js';

const coreSortMap = {
  latest: '-lastPostedAt',
  top: '-commentCount',
  newest: '-createdAt',
  oldest: 'createdAt',
};

test('clean forum root no longer forces Top; native Latest remains default', () => {
  assert.equal(DEFAULT_ROOT_SORT, null);
  assert.equal(isRootDiscussionPath('/'), true);
  assert.deepEqual(withDefaultRootSort({}, '/'), {});
  assert.deepEqual(withDefaultRootSort({ page: '2' }, '/'), { page: '2' });
});

test('explicit root sort remains user-controlled', () => {
  assert.deepEqual(withDefaultRootSort({ sort: 'latest' }, '/'), { sort: 'latest' });
  assert.deepEqual(withDefaultRootSort({ sort: 'top' }, '/'), { sort: 'top' });
  assert.deepEqual(withDefaultRootSort({ sort: 'newest' }, '/'), { sort: 'newest' });
});

test('search and non-root discussion pages keep params unchanged', () => {
  assert.deepEqual(withDefaultRootSort({ q: 'brakes' }, '/'), { q: 'brakes' });
  assert.deepEqual(withDefaultRootSort({}, '/t/toyota'), {});
  assert.deepEqual(withDefaultRootSort({}, '/following'), {});
});

test('sort map order is left native (Latest first in core map)', () => {
  assert.deepEqual(Object.keys(withRootSortOrder(coreSortMap, {}, '/')), Object.keys(coreSortMap));
  assert.equal(Object.keys(coreSortMap)[0], 'latest');
});
