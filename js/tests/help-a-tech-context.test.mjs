#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveHelpATechContext } from '../src/forum/utils/helpATechContext.js';

const mockManifest = {
  groups: [
    {
      id: 'brands',
      mode: 'tree',
      boards: [
        { name: 'Ford', slug: 'ford' },
        { name: 'Toyota', slug: 'toyota' },
        {
          name: 'CDJR',
          slug: 'cdjr',
          children: [
            { name: 'Chrysler', slug: 'chrysler' },
            { name: 'Dodge', slug: 'dodge' },
            { name: 'Jeep', slug: 'jeep' },
            { name: 'Ram', slug: 'ram' },
          ],
        },
      ],
    },
  ],
};

test('CONTEXT: resolves brand board correctly', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    manifest: mockManifest,
  });
  assert.notEqual(context, null);
  assert.equal(context.type, 'brand');
  assert.equal(context.slug, 'ford');
  assert.equal(context.label, 'Ford');
});

test('CONTEXT: resolves technician topics board correctly', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'general-shop-discussion' },
    manifest: mockManifest,
  });
  assert.notEqual(context, null);
  assert.equal(context.type, 'technician-topics');
  assert.equal(context.slug, 'general-shop-discussion');
});

test('CONTEXT: clean root index returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: null,
    routeName: 'index',
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: search query returns null (fail closed on search)', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    searchParams: { q: 'transmission' },
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: following route returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    routeName: 'following',
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: discussion route returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    routeName: 'discussion',
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: user profile route returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'ford' },
    routeName: 'user',
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: start-here board returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'start-here' },
    manifest: mockManifest,
  });
  assert.equal(context, null);
});

test('CONTEXT: unmanifested tag returns null', () => {
  const context = resolveHelpATechContext({
    currentTag: { slug: () => 'unknown-custom-tag' },
    manifest: mockManifest,
  });
  assert.equal(context, null);
});
