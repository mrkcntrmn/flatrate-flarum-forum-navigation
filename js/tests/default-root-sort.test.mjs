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

test('clean forum root defaults to Top without changing the URL contract', () => {
  assert.equal(DEFAULT_ROOT_SORT, 'top');
  assert.equal(isRootDiscussionPath('/'), true);
  assert.deepEqual(withDefaultRootSort({}, '/'), { sort: 'top' });
  assert.deepEqual(withDefaultRootSort({ page: '2' }, '/'), { page: '2', sort: 'top' });
});

test('explicit root sort remains user-controlled', () => {
  assert.deepEqual(withDefaultRootSort({ sort: 'latest' }, '/'), { sort: 'latest' });
  assert.deepEqual(withDefaultRootSort({ sort: 'newest' }, '/'), { sort: 'newest' });
});

test('search and non-root discussion pages keep native defaults', () => {
  assert.deepEqual(withDefaultRootSort({ q: 'brakes' }, '/'), { q: 'brakes' });
  assert.deepEqual(withDefaultRootSort({}, '/t/toyota'), {});
  assert.deepEqual(withDefaultRootSort({}, '/following'), {});
});

test('Top becomes first sort only on the non-search root feed', () => {
  assert.deepEqual(Object.keys(withRootSortOrder(coreSortMap, {}, '/')), [
    'top',
    'latest',
    'newest',
    'oldest',
  ]);
  assert.deepEqual(Object.keys(withRootSortOrder(coreSortMap, { sort: 'latest' }, '/')), [
    'top',
    'latest',
    'newest',
    'oldest',
  ]);
  assert.deepEqual(Object.keys(withRootSortOrder(coreSortMap, { q: 'brakes' }, '/')), Object.keys(coreSortMap));
  assert.deepEqual(Object.keys(withRootSortOrder(coreSortMap, {}, '/t/toyota')), Object.keys(coreSortMap));
});
