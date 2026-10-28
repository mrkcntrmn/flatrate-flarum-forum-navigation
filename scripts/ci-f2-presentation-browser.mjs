// CI-only acceptance against the disposable Flarum instance created by the
// install smoke. Local interactive verification uses the user's chosen Chrome.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../js/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const base = process.argv[2];
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base || '')) {
  throw new Error('Disposable loopback fixture URL required');
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base);
  await expect(page.locator('.WelcomeHero .Hero-close')).toHaveCount(0);
  const nav = page.locator('.IndexPage-nav .FlatRatePresentationNav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Aston Martin', exact: true })).toHaveAttribute('href', '/t/aston-martin');
  await nav.getByRole('link', { name: 'Aston Martin', exact: true }).click();
  await expect(page).toHaveURL(`${base}/t/aston-martin`);
  // URL changes alone do not prove that the IndexPage remounted.
  await expect(page.locator('.TagHero .Hero-title')).toHaveText('Aston Martin');
  await nav.getByRole('link', { name: 'START', exact: true }).click();
  await expect(page.locator('.TagHero .Hero-title')).toHaveText('Start Here');
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto(base);
  await expect(page.locator('.App-titleControl')).toBeVisible();
  await page.locator('.App-titleControl .Dropdown-toggle').click();
  await expect(page.locator('.App-titleControl .FlatRatePresentationNav')).toBeVisible();
  await expect(page.locator('.App-titleControl .FlatRateCenterQuickRail')).toBeVisible();
  assert.deepEqual(errors, [], 'Restored bundle must boot and render without JavaScript errors');
  console.log('F2_PRESENTATION_BROWSER=PASS desktop, force-remounted boards, phone picker, quick rail');
} finally {
  await browser.close();
}
