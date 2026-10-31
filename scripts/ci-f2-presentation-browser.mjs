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
  // Regression: each top-level Brand label must visually center beneath
  // the middle quick-rail icon across supported phone widths. The old
  // percentage margin centered inside a nested intrinsic-width ancestor.
  for (const width of [320, 360, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 851 });
    const acura = page.locator('.App-titleControl .FlatRatePresentationNav-brandName').filter({ hasText: /^Acura$/ }).first();
    await expect(acura).toBeVisible();
    const geometry = await acura.evaluate((element) => ({
      labelCenter: (element.getBoundingClientRect().left + element.getBoundingClientRect().right) / 2,
      viewportCenter: window.innerWidth / 2,
      sheetWidth: element.closest('.Dropdown-menu')?.getBoundingClientRect().width,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(Math.abs(geometry.labelCenter - geometry.viewportCenter) <= 2,
      `Brand not centered at ${width}px: ${JSON.stringify(geometry)}`);
    assert.ok(Math.abs(geometry.sheetWidth - width) <= 2,
      `Brand sheet not viewport-sized at ${width}px: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.scrollWidth <= width + 1, `unexpected horizontal scroll at ${width}px`);
  }

  await page.setViewportSize({ width: 390, height: 851 });
  await page.locator('.App-titleControl .Dropdown-toggle').click();
  await page.locator('.Navigation-drawer').click();
  const drawerSearch = page.locator('.App-drawer .item-search button.Search-input');
  await expect(drawerSearch).toBeVisible();
  const searchGeometry = await drawerSearch.evaluate((element) => {
    const icon = element.querySelector('.Button-icon').getBoundingClientRect();
    const label = element.querySelector('.Button-label').getBoundingClientRect();
    return {
      gap: label.left - icon.right,
      pseudo: getComputedStyle(element, '::before').content,
      label: element.querySelector('.Button-labelText')?.textContent,
    };
  });
  assert.ok(searchGeometry.gap >= 4, `drawer Search icon overlaps label: ${JSON.stringify(searchGeometry)}`);
  assert.ok(searchGeometry.pseudo === 'none' || searchGeometry.pseudo === 'normal',
    `obsolete search pseudo-label present: ${JSON.stringify(searchGeometry)}`);
  assert.ok(searchGeometry.label?.trim(), 'native F2 Search label must remain visible');
  for (const item of ['flags', 'themeSwitcher']) {
    const row = page.locator(`.App-drawer .Header-controls > .item-${item}`);
    if (await row.count()) await expect(row).toBeHidden();
  }
  await drawerSearch.click();
  await expect(page.locator('.SearchModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto(`${base}/t/aston-martin`);
  await expect(page.locator('.IndexPage-toolbar-action .item-search')).toHaveCount(0);
  await expect(page.locator('.IndexPage-toolbar-action .FlatRateInlineNewDiscussion')).toHaveCount(1);
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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.FlatRateMainLandingPins').getByRole('link', { name: /Pinned acceptance discussion/ }).click();
  await expect(page.locator('.DiscussionHero-title')).toHaveText('Pinned acceptance discussion');
  const structuralBack = page.getByRole('link', { name: 'Back to Aston Martin', exact: true });
  await expect(structuralBack).toHaveCount(1);
  const details = page.getByRole('button', { name: 'Expand discussion details', exact: true });
  await expect(details).toHaveAttribute('aria-expanded', 'false');
  const heroMetrics = await details.evaluate((button) => ({
    width: button.getBoundingClientRect().width,
    height: button.getBoundingClientRect().height,
    color: getComputedStyle(button).color,
    heroColor: getComputedStyle(button.closest('.DiscussionHero')).color,
  }));
  assert.ok(heroMetrics.width >= 44 && heroMetrics.height >= 44);
  assert.equal(heroMetrics.color, heroMetrics.heroColor, 'hero controls retain banner text contrast');
  await details.click();
  await expect(page.getByRole('button', { name: 'Collapse discussion details', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.FlatRateDiscussionActions .Dropdown-toggle').click();
  await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  const follow = page.locator('.FlatRateDiscussionFollowStar');
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await expect(structuralBack).toHaveCount(1);
  await page.getByRole('button', { name: 'Write a Reply...', exact: true }).click();
  const reply = 'Synthetic phone reply acceptance.';
  const editor = page.locator('.Composer textarea');
  await expect(editor).toHaveAttribute('aria-label', /.+/);
  await editor.fill(reply);
  const sendReply = page.getByRole('button', { name: 'Post Reply', exact: true });
  await expect(sendReply).toBeVisible();
  const posted = page.waitForResponse((response) => response.url().endsWith('/api/posts') && response.request().method() === 'POST');
  await sendReply.click();
  assert.equal((await posted).status(), 201);
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await structuralBack.click();
  await expect(page).toHaveURL(`${base}/t/aston-martin`);
  await expect(page.getByRole('link', { name: 'Back to MAIN', exact: true })).toHaveCount(1);
  assert.deepEqual(errors, [], 'Restored bundle must boot and render without JavaScript errors');
  console.log('F2_PRESENTATION_BROWSER=PASS desktop, force-remounted boards, phone picker, quick rail, member preload pin exclusion, discussion controls/follow/reply');
} finally {
  await browser.close();
}
