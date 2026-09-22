#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { listDiscussionBrandBoards } from '../src/forum/utils/discussionBrandDropdownItems.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const discussionSrc = readFileSync(join(root, 'js/src/forum/discussionCenterMenu.js'), 'utf8');

const manifest = {
  groups: [
    {
      id: 'community',
      label: 'Push to Start',
      mode: 'link',
      destination: { type: 'tag', boardKey: 'start-here', slug: 'start-here' },
    },
    {
      id: 'technician-topics',
      label: 'Technician Topics',
      mode: 'link',
      destination: { type: 'tag', boardKey: 'general-shop-discussion', slug: 'general-shop-discussion' },
    },
    {
      id: 'brands',
      mode: 'tree',
      boards: [
        {
          boardKey: 'gm',
          name: 'GM',
          slug: 'gm',
          children: [
            { boardKey: 'chevrolet', name: 'Chevrolet', slug: 'chevrolet', children: [] },
            { boardKey: 'cadillac', name: 'Cadillac', slug: 'cadillac', children: [] },
          ],
        },
        { boardKey: 'ford', name: 'Ford', slug: 'ford', children: [] },
      ],
    },
  ],
};

test('listDiscussionBrandBoards flattens parent and child Brand boards', () => {
  assert.deepEqual(listDiscussionBrandBoards(manifest), [
    { boardKey: 'gm', name: 'GM', slug: 'gm', depth: 0 },
    { boardKey: 'chevrolet', name: 'Chevrolet', slug: 'chevrolet', depth: 1 },
    { boardKey: 'cadillac', name: 'Cadillac', slug: 'cadillac', depth: 1 },
    { boardKey: 'ford', name: 'Ford', slug: 'ford', depth: 0 },
  ]);
});

test('listDiscussionBrandBoards skips START and Technician Topics groups', () => {
  const boards = listDiscussionBrandBoards(manifest);
  assert.equal(boards.some((board) => board.slug === 'start-here'), false);
  assert.equal(boards.some((board) => board.slug === 'general-shop-discussion'), false);
  assert.equal(boards.some((board) => /following/i.test(board.name || '')), false);
});

test('listDiscussionBrandBoards returns empty when Brand tree is absent', () => {
  assert.deepEqual(listDiscussionBrandBoards({ groups: [] }), []);
  assert.deepEqual(listDiscussionBrandBoards(null), []);
});

test('discussion center SelectDropdown uses Brand LinkButtons, not PresentationNav', () => {
  assert.match(discussionSrc, /listDiscussionBrandBoards\(manifest\)/);
  assert.match(discussionSrc, /FlatRateDiscussionBrandLink/);
  assert.match(discussionSrc, /brandHref\(board\)/);
  assert.match(discussionSrc, /brand-\$\{board\.boardKey\}/);
  assert.doesNotMatch(
    discussionSrc,
    /pickerItems\.add\(\s*'flatratePresentationNav',\s*<PresentationNav/
  );
  assert.doesNotMatch(discussionSrc, /hideStart/);
  assert.doesNotMatch(discussionSrc, /following/i);
});
