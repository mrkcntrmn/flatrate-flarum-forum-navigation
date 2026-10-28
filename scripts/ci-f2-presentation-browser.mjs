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
  // Exercise the first authenticated MAIN load, including core's server preload.
  const tokenResponse = await page.request.post(`${base}/api/token`, {
    data: { identification: 'navadmin', password: 'nav-admin-pass' },
  });
  assert.equal(tokenResponse.status(), 200);
  const { token } = await tokenResponse.json();
  const headers = { Authorization: `Token ${token}` };
  const tags = (await (await page.request.get(`${base}/api/tags`)).json()).data;
  const tagId = tags.find((tag) => tag.attributes.slug === 'aston-martin').id;
  async function discussion(title) {
    const response = await page.request.post(`${base}/api/discussions`, { headers, data: {
      data: { type: 'discussions', attributes: { title, content: 'Synthetic browser acceptance content.' },
        relationships: { tags: { data: [{ type: 'tags', id: tagId }] } } },
    } });
    assert.equal(response.status(), 201);
    return (await response.json()).data.id;
  }
  const pinId = await discussion('Pinned acceptance discussion');
  await discussion('Ordinary acceptance discussion');
  const settings = await page.request.post(`${base}/api/settings`, { headers, data: {
    'flatrate-forum-navigation.member_main_pinned_discussion_ids': JSON.stringify([Number(pinId)]),
  } });
  assert.equal(settings.status(), 204);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(base);
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or Email', exact: true }).fill('navadmin');
  await page.locator('.LogInModal input[name="password"]').fill('nav-admin-pass');
  await page.locator('.LogInModal').getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.locator('.FlatRateMainLandingPins[data-audience="member"]')).toContainText('Pinned acceptance discussion');
  const feed = page.locator('.DiscussionList:not(.FlatRateMainLandingPins-list)');
  await expect(feed).toContainText('Ordinary acceptance discussion');
  await expect(feed).not.toContainText('Pinned acceptance discussion');
  assert.deepEqual(errors, [], 'Restored bundle must boot and render without JavaScript errors');
  console.log('F2_PRESENTATION_BROWSER=PASS desktop, force-remounted boards, phone picker, quick rail, member preload pin exclusion');
} finally {
  await browser.close();
}
