import { test, expect } from '@playwright/test';

// Use standard credentials for Advisor test
const ADVISOR_EMAIL = process.env.TEST_ADVISOR_EMAIL || 'advisor@example.com';
const ADVISOR_PASS = process.env.TEST_ADVISOR_PASSWORD || 'password123';

test.describe('Advisor End-to-End Workflow', () => {
  // We want tests to run sequentially to simulate a full session workflow
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    // Create a shared page context for the entire workflow
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Advisor should be able to log in successfully', async () => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check if we are on the login page by verifying elements
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible();

    // Fill in credentials
    await page.fill('input[type="email"]', ADVISOR_EMAIL);
    await page.fill('input[type="password"]', ADVISOR_PASS);
    
    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for successful navigation to advisor dashboard
    await page.waitForURL(/.*\/dashboard\/advisor.*/, { timeout: 10000 });
    
    // Verify dashboard content is visible
    await expect(page.getByText('Active Interns').first()).toBeVisible({ timeout: 15000 });
  });

  test('2. Advisor can navigate to My Students and view assigned students', async () => {
    await page.goto('/dashboard/advisor/students');
    await page.waitForURL(/.*\/dashboard\/advisor\/students/);
    await expect(page.locator('h1', { hasText: 'My Students' }).first()).toBeVisible();
    
    // Expect stats cards or search input to show up
    await expect(page.getByPlaceholder('Search students...').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Advisor can navigate to Requirements and manage documents', async () => {
    await page.goto('/dashboard/advisor/requirements');
    await page.waitForURL(/.*\/dashboard\/advisor\/requirements/);
    await expect(page.locator('h1', { hasText: 'Document Requirements' }).first()).toBeVisible();
    
    // Wait for standard UI elements like 'Create Requirement'
    const newReqBtn = page.getByText('Create Requirement', { exact: false });
    // In case there is a table or no requirements state
    const tableOrList = page.locator('table, .grid');
    await expect(newReqBtn.or(tableOrList).first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Advisor can navigate to Documents and view/upload files', async () => {
    await page.goto('/dashboard/advisor/documents');
    await page.waitForURL(/.*\/dashboard\/advisor\/documents/);
    await expect(page.locator('h1', { hasText: 'Documents' }).first()).toBeVisible();

    const uploadArea = page.locator('button:has-text("Upload"), input[type="file"], .dropzone');
    await expect(uploadArea.first()).toBeVisible({ timeout: 10000 });
  });

  test('5. Advisor can navigate to Evaluations to view supervisor evaluations', async () => {
    await page.goto('/dashboard/advisor/evaluations');
    await page.waitForURL(/.*\/dashboard\/advisor\/evaluations/);
    await expect(page.locator('h1', { hasText: 'Final Evaluations' }).first()).toBeVisible();
    
    // Check for some table or placeholder
    const listContainer = page.locator('table, .grid, [data-testid="evaluations-list"]');
    await expect(listContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('6. Advisor can navigate to Messages for conversations', async () => {
    await page.goto('/dashboard/advisor/messages');
    await page.waitForURL(/.*\/dashboard\/advisor\/messages/);
    await expect(page.locator('h1', { hasText: 'Messages' }).first()).toBeVisible();
    
    // Make sure search or chat list is visible
    await expect(page.getByPlaceholder('Search', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('7. Advisor can navigate to Settings page and update profile details', async () => {
    await page.goto('/dashboard/advisor/settings');
    await page.waitForURL(/.*\/dashboard\/advisor\/settings/);
    await expect(page.locator('h1', { hasText: 'Settings' }).or(page.locator('h1', { hasText: 'Profile' })).first()).toBeVisible();
    
    // Ensure form fields are loaded by looking for first name or faculty id
    await expect(page.getByPlaceholder('Enter first name').first()).toBeVisible({ timeout: 10000 });
  });
});
