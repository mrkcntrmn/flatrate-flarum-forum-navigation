#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { findBrandNodeBySlug, listDirectBrandChildren } from '../src/forum/utils/brandNode.js';
import { shouldShowBrandLive } from '../src/forum/utils/brandLivePin.js';
import { shouldShowMainLiveChat, visibleLiveCount } from '../src/forum/utils/mainLiveChat.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(root, 'resources/navigation-runtime-manifest.json'), 'utf8'));
const livePinSrc = readFileSync(join(root, 'js/src/forum/components/LiveBoardPin.js'), 'utf8');
const brandPinSrc = readFileSync(join(root, 'js/src/forum/components/BrandLivePin.js'), 'utf8');
const mainPinSrc = readFileSync(join(root, 'js/src/forum/components/MainLiveChatPin.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'js/src/forum/index.js'), 'utf8');
const less = readFileSync(join(root, 'resources/less/forum.less'), 'utf8');
const voteTotalSrc = readFileSync(join(root, 'js/src/forum/components/BrandVoteTotal.js'), 'utf8');

function brandLiveContext(slug, signedIn) {
  return {
    signedIn,
    routeName: 'tag',
    currentTag: { slug: () => slug },
    page: 1,
    manifest,
    provider: { available: () => true },
  };
}

test('MAIN Live keeps FLATRATE.WIKI and a decorative chat icon after the title', () => {
  assert.ok(mainPinSrc.includes('title="FLATRATE.WIKI"'));
  assert.match(mainPinSrc, /ariaLabel="Open Public Live chat"/);
  assert.match(livePinSrc, /FlatRateMainLiveChat-titleGroup/);
  const titleAt = livePinSrc.indexOf('FlatRateMainLiveChat-title');
  const bubblesAt = livePinSrc.indexOf('fas fa-comments');
  assert.ok(titleAt > -1 && bubblesAt > titleAt);
  assert.match(livePinSrc, /FlatRateMainLiveChat-bubbles" aria-hidden="true"/);
  assert.match(less, /\.FlatRateMainLiveChat-title\s*\{[^}]*font-size:\s*16px/);
  assert.match(less, /\.FlatRateMainLiveChat-title\s*\{[^}]*color:\s*#ffffff/);
  assert.match(less, /\.FlatRateMainLiveChat-bubbles\s*\{[^}]*color:\s*#ffffff/);
});

test('Audi Live and BMW Live use the brand name, not a second hero title', () => {
  const audi = findBrandNodeBySlug(manifest, 'audi');
  const bmw = findBrandNodeBySlug(manifest, 'bmw');
  assert.equal(`${audi.name} Live`, 'Audi Live');
  assert.equal(`${bmw.name} Live`, 'BMW Live');
  assert.match(brandPinSrc, /title=\{`\$\{name\} Live`\}/);
  assert.match(brandPinSrc, /ariaLabel=\{`Open \$\{name\} Public Live chat`\}/);
  assert.match(indexSrc, /omitNativeBrandHeroTitle/);
  assert.match(indexSrc, /FlatRateBrandHero/);
  assert.doesNotMatch(indexSrc, /BrandVoteTotal/);
  assert.match(voteTotalSrc, /class BrandVoteTotal/);
});

test('GM, CDJR, and JLR parents keep hierarchy and signed-in Live', () => {
  assert.deepEqual(
    listDirectBrandChildren(findBrandNodeBySlug(manifest, 'gm')).map((child) => child.name),
    ['Buick', 'Cadillac', 'Chevrolet', 'GMC']
  );
  assert.deepEqual(
    listDirectBrandChildren(findBrandNodeBySlug(manifest, 'cdjr')).map((child) => child.name),
    ['Chrysler', 'Dodge', 'Jeep', 'Ram']
  );
  assert.deepEqual(
    listDirectBrandChildren(findBrandNodeBySlug(manifest, 'jlr')).map((child) => child.name),
    ['Jaguar', 'Land Rover', 'Range Rover']
  );

  for (const slug of ['audi', 'bmw', 'gm', 'cdjr', 'jlr']) {
    assert.equal(shouldShowBrandLive(brandLiveContext(slug, false)), false, `${slug} guest`);
    assert.equal(shouldShowBrandLive(brandLiveContext(slug, true)), true, `${slug} signed-in`);
  }
});

test('guest is denied; signed-in member and admin both keep MAIN Live', () => {
  const provider = { available: () => true, href: () => '/messages/live/community-general-live' };
  assert.equal(shouldShowMainLiveChat({ signedIn: false, pathname: '/', page: 1, provider }), false);
  assert.equal(shouldShowMainLiveChat({ signedIn: true, pathname: '/', page: 1, provider }), true);
  // Admin is not a separate Live gate and this repo has no production account.
  assert.equal(
    shouldShowMainLiveChat({ signedIn: true, pathname: '/', page: 1, provider, actor: 'admin' }),
    true
  );
});

test('positive Live counts show; unknown and zero are omitted', () => {
  assert.equal(visibleLiveCount(4), 4);
  assert.equal(visibleLiveCount(1), 1);
  assert.equal(visibleLiveCount(0), null);
  assert.equal(visibleLiveCount(null), null);
  assert.equal(visibleLiveCount(undefined), null);
  assert.equal(visibleLiveCount(Number.NaN), null);
  assert.match(livePinSrc, /shownCount != null/);
  assert.doesNotMatch(livePinSrc, />0</);
});

test('globe is card-center anchored and not a flex sibling of PUBLIC and LIVE', () => {
  // This repo's node test runner cannot measure CSS pixels. Browser geometry
  // at 353, 360, 390, 412, and desktop widths is still required:
  // abs(globeCenterX - cardCenterX) <= 1 CSS px.
  const status = less.match(/\.FlatRateMainLiveChat-status\s*\{([^}]*)\}/);
  const globe = less.match(/\.FlatRateMainLiveChat-globe\s*\{([^}]*)\}/);
  const publicSlot = less.match(/\.FlatRateMainLiveChat-public\s*\{([^}]*)\}/);
  const liveSlot = less.match(/\.FlatRateMainLiveChat-live\s*\{([^}]*)\}/);
  assert.ok(status && globe && publicSlot && liveSlot);
  assert.match(status[1], /display:\s*block/);
  assert.match(status[1], /width:\s*100%/);
  assert.doesNotMatch(status[1], /display:\s*(inline-)?flex/);
  assert.match(globe[1], /position:\s*absolute/);
  assert.match(globe[1], /left:\s*50%/);
  assert.match(globe[1], /transform:\s*translateX\(-50%\)/);
  assert.match(globe[1], /color:\s*#66ff00/);
  assert.match(publicSlot[1], /position:\s*absolute/);
  assert.match(liveSlot[1], /position:\s*absolute/);
  assert.match(less, /Node tests cannot measure CSS pixels/);

  const statusAt = livePinSrc.indexOf('className="FlatRateMainLiveChat-status"');
  const globeAt = livePinSrc.indexOf('className="fas fa-globe FlatRateMainLiveChat-globe"');
  const liveAt = livePinSrc.indexOf('className="FlatRateMainLiveChat-live"');
  assert.ok(statusAt > -1 && globeAt > statusAt && liveAt > globeAt);
  const liveBlock = livePinSrc.slice(liveAt, livePinSrc.indexOf('</span>', liveAt));
  assert.doesNotMatch(liveBlock, /fa-globe/);
});
