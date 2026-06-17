import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.TEST_ADMIN_PASSWORD || 'password123';

test.describe('Admin End-to-End Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Admin should be able to log in successfully', async () => {
    await page.goto('/login');
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible();

    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASS);
    
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/admin.*/, { timeout: 10000 });
    await expect(page.locator('h2', { hasText: 'OJT Platform Overview' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Admin can navigate to Users Management', async () => {
    await page.goto('/dashboard/admin/users');
    await page.waitForURL(/.*\/dashboard\/admin\/users/);
    await expect(page.locator('h1', { hasText: 'User Management' }).first()).toBeVisible();
    
    await expect(page.getByPlaceholder('Search by name or email...').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Admin can navigate to Companies Management', async () => {
    await page.goto('/dashboard/admin/companies');
    await page.waitForURL(/.*\/dashboard\/admin\/companies/);
    await expect(page.locator('h1', { hasText: 'Companies Management' }).first()).toBeVisible();
    
    await expect(page.getByPlaceholder('Search by company name...').first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Admin can navigate to Internships Management', async () => {
    await page.goto('/dashboard/admin/internships');
    await page.waitForURL(/.*\/dashboard\/admin\/internships/);
    await expect(page.locator('h1', { hasText: 'Internships Management' }).first()).toBeVisible();
  });

  test('5. Admin can navigate to Evaluations Management', async () => {
    await page.goto('/dashboard/admin/evaluations');
    await page.waitForURL(/.*\/dashboard\/admin\/evaluations/);
    await expect(page.locator('h1', { hasText: 'Evaluations Management' }).first()).toBeVisible();
  });

  test('6. Admin can navigate to Rubrics Management', async () => {
    await page.goto('/dashboard/admin/rubrics');
    await page.waitForURL(/.*\/dashboard\/admin\/rubrics/);
    await expect(page.locator('h1', { hasText: 'Rubrics Management' }).first()).toBeVisible();
  });

  test('7. Admin can navigate to Document Management', async () => {
    await page.goto('/dashboard/admin/documents');
    await page.waitForURL(/.*\/dashboard\/admin\/documents/);
    await expect(page.locator('h1', { hasText: 'Document Management' }).first()).toBeVisible();
  });

  test('8. Admin can navigate to MOA Verification', async () => {
    await page.goto('/dashboard/admin/moa');
    await page.waitForURL(/.*\/dashboard\/admin\/moa/);
    await expect(page.locator('h2', { hasText: 'MOA Management' }).first()).toBeVisible();
  });

  test('9. Admin can navigate to Reports & Analytics', async () => {
    await page.goto('/dashboard/admin/reports');
    await page.waitForURL(/.*\/dashboard\/admin\/reports/);
    await expect(page.locator('h1', { hasText: 'Reports & Analytics' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('10. Admin can navigate to Settings', async () => {
    await page.goto('/dashboard/admin/settings');
    await page.waitForURL(/.*\/dashboard\/admin\/settings/);
    await expect(page.locator('h1', { hasText: 'Settings' }).or(page.locator('h1', { hasText: 'System Settings' })).first()).toBeVisible();
  });
});
