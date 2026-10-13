#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { selectHelpATechDiscussions } from '../src/forum/utils/helpATechSelection.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const less = readFileSync(join(root, 'resources/less/help-a-tech.less'), 'utf8');
const helpATechSrc = readFileSync(join(root, 'js/src/forum/components/HelpATech.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');

const fordContext = {
  type: 'brand',
  slug: 'ford',
  board: { name: 'Ford', slug: 'ford' },
};

function createViewer({ id = 1, admin = true } = {}) {
  return {
    id: () => id,
    isAdmin: () => admin,
  };
}

test('SECURITY: mixed inventory isolates only authorized, replyable, context-relevant discussions', () => {
  const viewer = createViewer();
  const inventory = [
    // 2 Eligible Ford discussions
    { id: () => 101, title: () => 'Ford 1', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, user: () => ({ id: () => 50 }), tags: () => [{ slug: () => 'ford' }] },
    { id: () => 102, title: () => 'Ford 2', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, user: () => ({ id: () => 51 }), tags: () => [{ slug: () => 'ford' }] },
    // 5 Ineligible (cannot reply)
    { id: () => 201, title: () => 'Private 1', canReply: () => false, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 202, title: () => 'Private 2', canReply: () => false, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 203, title: () => 'Private 3', canReply: () => false, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 204, title: () => 'Private 4', canReply: () => false, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 205, title: () => 'Private 5', canReply: () => false, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    // 3 Locked
    { id: () => 301, title: () => 'Locked 1', canReply: () => true, isHidden: () => false, isLocked: () => true, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 302, title: () => 'Locked 2', canReply: () => true, isHidden: () => false, isLocked: () => true, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    { id: () => 303, title: () => 'Locked 3', canReply: () => true, isHidden: () => false, isLocked: () => true, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    // 1 Hidden
    { id: () => 401, title: () => 'Hidden 1', canReply: () => true, isHidden: () => true, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'ford' }] },
    // 4 Unrelated Brand (Chevrolet)
    { id: () => 501, title: () => 'Chevy 1', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'chevrolet' }] },
    { id: () => 502, title: () => 'Chevy 2', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'chevrolet' }] },
    { id: () => 503, title: () => 'Chevy 3', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'chevrolet' }] },
    { id: () => 504, title: () => 'Chevy 4', canReply: () => true, isHidden: () => false, isLocked: () => false, isDeleted: () => false, tags: () => [{ slug: () => 'chevrolet' }] },
  ];

  const selected = selectHelpATechDiscussions({
    discussions: inventory,
    viewer,
    context: fordContext,
    adminPreviewEnabled: true,
  });

  assert.equal(selected.length, 2);
  assert.equal(selected[0].id(), 101);
  assert.equal(selected[1].id(), 102);
});

test('SECURITY: no post content, message body, or private chat snippet serialized or rendered', () => {
  // Source contract check: Component must only render title and contextLabel, never post content
  assert.doesNotMatch(helpATechSrc, /discussion\.body\b/);
  assert.doesNotMatch(helpATechSrc, /discussion\.content\b/);
  assert.doesNotMatch(helpATechSrc, /postSnippet/);
  assert.doesNotMatch(helpATechSrc, /chatMessage/);
  assert.match(helpATechSrc, /discussion\.title/);
});

test('SECURITY: index mount enforces dual-gate and consumes active board discussions only', () => {
  assert.match(indexSrc, /adminPreviewEnabled\s*=\s*!!\(/);
  assert.match(indexSrc, /flatrateHelpATechAdminPreview/);
  assert.match(indexSrc, /if\s*\(signedIn\s*&&\s*adminPreviewEnabled\)/);
  assert.match(indexSrc, /items\.remove\(['"]flatrateHelpATech['"]\)/);
  assert.match(indexSrc, /getActiveBoardDiscussions\(app\.discussions\)/);
  assert.doesNotMatch(indexSrc, /app\.store\.all\(['"]discussions['"]\)/);
});

test('SECURITY: settled UI decisions preserved in Less styling', () => {
  // Pink styling prohibited
  assert.ok(!less.includes('#ff69b4'));
  assert.ok(!less.includes('pink'));
  // Collapsible accordion banners prohibited
  assert.ok(!less.includes('collapsible'));
  assert.ok(!less.includes('accordion'));
  // Chat bubble styling prohibited
  assert.ok(!less.includes('chat-bubble'));
});
