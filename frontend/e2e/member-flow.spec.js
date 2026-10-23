import { test, expect } from '@playwright/test';
const user = { id: 'test-member', name: 'Test Member', email: 'member@example.com' };
const prices = { Starter: 15000, Standard: 17000, Premium: 29000, VIP: 40000 };
async function mockApi(page, { signedIn = false, plan = null } = {}) {
  let authenticated = signedIn;
  const requests = [];
  const active = plan ? { id: 'current-plan', plan, billing: 'monthly', startDate: '2026-10-30', expiresAt: '2026-11-30T00:00:00Z', price: prices[plan], currency: 'NGN', status: 'active', daysRemaining: 20 } : null;
  const memberships = active ? [active] : [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200, body = {};
    if (path === '/api/pricing') body = { prices, currency: 'NGN', yearlyMultiplier: 10 };
    else if (path === '/api/signup' || path === '/api/member/login') { authenticated = true; body = path === '/api/signup' ? { id: user.id, name: user.name } : { user }; }
    else if (path === '/api/member/logout') { authenticated = false; body = { authenticated: false }; }
    else if (!authenticated) { status = 401; body = { error: 'Please sign in.' }; }
    else if (path === '/api/member/session') body = { user };
    else if (path === '/api/member/dashboard') body = { user, memberships, currentMembershipId: active?.id || null, upgradeOptions: active ? ['Starter', 'Standard', 'Premium', 'VIP'].slice(['Starter', 'Standard', 'Premium', 'VIP'].indexOf(plan) + 1) : [] };
    else if (path === '/api/member/memberships') {
      const data = route.request().postDataJSON(); requests.push(data);
      memberships.push({ id: 'pending-plan', ...data, status: 'pending', currency: 'NGN', price: prices[data.plan], daysRemaining: null });
      body = { id: 'pending-plan', status: 'pending' };
    }
    await route.fulfill({ status, json: body });
  });
  return requests;
}

test('signup is a separate account page and opens the member dashboard with a simplified header', async ({ page }) => {
  await mockApi(page);
  await page.goto('/#Signup');
  await expect(page.getByRole('heading', { name: 'Sign up for FORMA' })).toBeVisible();
  await expect(page.locator('form select')).toHaveCount(0);
  await page.getByLabel('Full name', { exact: true }).fill(user.name);
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('long-member-password');
  await page.getByLabel('Confirm password', { exact: true }).fill('long-member-password');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/#Dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome back, Test Member.' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'My dashboard' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  await expect(page.locator('header').getByRole('button', { name: 'Join now' })).toHaveCount(0);
  await expect(page.locator('.class-grid .class-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Choose your membership plan' })).toBeVisible();
});

test('sign in opens exact subscription details and permits only higher-tier upgrade choices', async ({ page }) => {
  const requests = await mockApi(page, { plan: 'Standard' });
  await page.goto('/#Signin');
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('long-member-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/#Dashboard$/);
  await expect(page.locator('.membership-overview')).toContainText('Standard membership');
  await expect(page.locator('.membership-overview')).toContainText('30 November 2026');
  await expect(page.locator('.membership-overview')).toContainText('20 days');
  await expect(page.getByRole('button', { name: 'Upgrade to Premium', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upgrade to VIP', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upgrade to Starter' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Upgrade to Premium', exact: true }).click();
  await expect(page.getByLabel('Plan', { exact: true }).locator('option')).toHaveText(['Premium', 'VIP']);
  await page.getByLabel('Plan', { exact: true }).selectOption('VIP');
  await page.getByLabel('Preferred start date').fill('2026-10-30');
  await page.getByRole('button', { name: 'Submit upgrade request' }).click();
  await expect(page.getByRole('status')).toContainText('pending management approval');
  expect(requests[0].upgradeFromId).toBe('current-plan');
  expect(requests[0].plan).toBe('VIP');
  await expect(page.locator('.membership-overview')).toContainText('Standard membership');
});

test('VIP member mobile layout has no public account actions and sign-out restores sign-in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { signedIn: true, plan: 'VIP' });
  await page.goto('/#Dashboard');
  await expect(page.getByRole('heading', { name: 'You have VIP access' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Upgrade to/ })).toHaveCount(0);
  const cards = page.locator('.class-card');
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(second.y).toBeGreaterThan(first.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('header').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/#Signin$/);
  await expect(page.getByRole('heading', { name: 'Sign in to your member account' })).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'Join now' })).toHaveCount(0);
  await expect(page.locator('.auth-page').getByRole('link', { name: 'Create an account' })).toBeVisible();
});

test('account navigation and layouts work on phones, tablets and laptops', async ({ page }) => {
  await mockApi(page);
  for (const width of [320, 390, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['Signup', 'Signin']) {
      await page.goto(`/#${route}`);
      await expect(page.locator('.auth-page')).toBeVisible();
      await expect(page.locator('header').getByRole('link', { name: /^(Sign up|Sign in)$/ })).toHaveCount(0);
      await expect(page.locator('header').getByRole('button', { name: 'Join now' })).toHaveCount(0);
      await expect(page.locator('.auth-page > p:last-child a')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  }
});

test('management can find pending requests and confirm membership from the dashboard', async ({ page }) => {
  const membership = { id: 'review-request', email: 'member@example.com', plan: 'Starter', billing: 'monthly', startDate: '2026-10-24', status: 'pending', createdAt: '2026-10-24T00:00:00Z' };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/pricing') return route.fulfill({ json: { prices, currency: 'NGN' } });
    if (path === '/api/member/session') return route.fulfill({ status: 401, json: { error: 'Please sign in.' } });
    if (path === '/api/admin/activity') return route.fulfill({ json: {
      counts: { users: 1, memberships: 1 }, members: [], memberships: [membership], activity: [],
    } });
    if (path === '/api/admin/memberships/review-request/confirm') {
      expect(route.request().method()).toBe('POST');
      Object.assign(membership, { status: 'active', expiresAt: '2026-11-24T00:00:00Z', confirmedAt: '2026-10-24T12:00:00Z', confirmedBy: 'manager@example.com' });
      return route.fulfill({ json: { membership } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/#Admin');
  await page.getByRole('button', { name: 'Review pending memberships (1)' }).click();
  await expect(page.getByRole('button', { name: 'Confirm membership', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm membership', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('membership accepted');
  await expect(page.getByRole('button', { name: 'Review pending memberships (0)' })).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.admin-table')).toContainText('Accepted');
  await expect(page.getByRole('button', { name: 'Link member account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm membership', exact: true })).toHaveCount(0);
});

test('password visibility controls preserve values and work independently for members and administrators', async ({ page }) => {
  await mockApi(page);
  async function check(field, label) {
    await field.fill('example-password-for-preview');
    await expect(field).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: `Show ${label}`, exact: true }).click();
    await expect(field).toHaveAttribute('type', 'text');
    await expect(field).toHaveValue('example-password-for-preview');
    await page.getByRole('button', { name: `Hide ${label}`, exact: true }).click();
    await expect(field).toHaveAttribute('type', 'password');
  }
  await page.goto('/#Signup');
  await check(page.locator('#signup-password'), 'password');
  await check(page.locator('#signup-confirmPassword'), 'confirm password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.locator('#signup-confirmPassword')).toHaveAttribute('type', 'password');
  await expect(page).toHaveURL(/#Signup$/);
  await page.goto('/#Signin');
  await check(page.locator('#signin-password'), 'password');
  await page.goto('/#Admin');
  await check(page.locator('#admin-login-password'), 'password');
  await page.route('**/api/admin/activity', route => route.fulfill({ json: { counts: {}, members: [], memberships: [], activity: [] } }));
  await page.route('**/api/admin/administrators', route => route.fulfill({ json: { administrators: [] } }));
  await page.reload();
  await page.getByRole('button', { name: 'Administrators', exact: true }).click();
  await check(page.locator('#administrator-password'), 'password');
  await check(page.locator('#administrator-confirmPassword'), 'confirm password');
  await expect(page.getByRole('heading', { name: 'Add an administrator' })).toBeVisible();
});
