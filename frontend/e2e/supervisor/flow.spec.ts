import { test, expect } from '@playwright/test';

const SUPERVISOR_EMAIL = 'dma.supervisor2@cvsu.edu.ph';
const SUPERVISOR_PASS = 'supervisor111';

test.describe('Supervisor End-to-End Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Supervisor should be able to log in successfully', async () => {
    await page.goto('/login');
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible();

    await page.fill('input[type="email"], input[name="email"]', SUPERVISOR_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', SUPERVISOR_PASS);
    
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/supervisor\/interns.*/, { timeout: 10000 });
    await expect(page.locator('h1', { hasText: 'My Interns' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Supervisor can navigate to My Interns and view assigned students', async () => {
    await page.goto('/dashboard/supervisor/interns');
    await page.waitForURL(/.*\/dashboard\/supervisor\/interns/);
    await expect(page.locator('h1', { hasText: 'My Interns' }).first()).toBeVisible();
    
    // Expect the table or a search input to be present
    await expect(page.getByPlaceholder('Search interns...').or(page.locator('table')).first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Supervisor can navigate to Evaluations to rate students', async () => {
    await page.goto('/dashboard/supervisor/evaluations');
    await page.waitForURL(/.*\/dashboard\/supervisor\/evaluations/);
    await expect(page.locator('h1', { hasText: 'Final Evaluation' }).first()).toBeVisible();
    
    // Check if the select intern dropdown is present
    await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Supervisor can navigate to Messages for conversations', async () => {
    await page.goto('/dashboard/supervisor/messages');
    await page.waitForURL(/.*\/dashboard\/supervisor\/messages/);
    await expect(page.locator('h1', { hasText: 'Messages' }).first()).toBeVisible();
    
    await expect(page.getByPlaceholder('Search', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('5. Supervisor can navigate to Settings page and update profile details', async () => {
    await page.goto('/dashboard/supervisor/settings');
    await page.waitForURL(/.*\/dashboard\/supervisor\/settings/);
    await expect(page.locator('h1', { hasText: 'Settings' }).or(page.locator('h1', { hasText: 'Profile' })).first()).toBeVisible();
    
    await expect(page.getByPlaceholder('Enter first name').first()).toBeVisible({ timeout: 10000 });
  });
});
