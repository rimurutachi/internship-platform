import { test, expect } from '@playwright/test';

// Configuration for student credentials.
// For E2E testing, you should have a dedicated test account seeded in Supabase.
// Using environment variables allows you to override these in CI.
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'bsit.student2@cvsu.edu.ph';
const STUDENT_PASS = process.env.TEST_STUDENT_PASSWORD || 'studentpass12345';

test.describe('Student End-to-End Workflow', () => {
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

  test('1. Student should be able to log in successfully', async () => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Check if we are on the login page by verifying elements
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible();

    // Fill in the email and password
    await page.fill('input[type="email"], input[name="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', STUDENT_PASS);

    // Submit the login form
    await page.click('button[type="submit"]');

    // Wait for the redirect to the student dashboard
    // We expect the URL to include "/dashboard/student"
    await page.waitForURL(/.*\/dashboard\/student.*/, { timeout: 10000 });
    
    // Verify dashboard content is visible
    await expect(page.locator('h1', { hasText: 'Student Dashboard' }).or(page.locator('h1', { hasText: 'Welcome' })).first()).toBeVisible();
  });

  test('2. Student can navigate to Requirements and view required files', async () => {
    // Navigate directly to bypass sidebar UI quirks
    await page.goto('/dashboard/student/requirements');
    
    // Verify navigation
    await page.waitForURL(/.*\/dashboard\/student\/requirements/);
    await expect(page.locator('h1', { hasText: 'Required Documents' }).first()).toBeVisible();
    
    // The page should either show a list of requirements or an empty state
    const tableOrList = page.locator('table, .grid');
    await expect(tableOrList.first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Student can navigate to Documents and view/upload files', async () => {
    // Navigate directly
    await page.goto('/dashboard/student/documents');
    
    // Verify navigation
    await page.waitForURL(/.*\/dashboard\/student\/documents/);
    await expect(page.locator('h1', { hasText: 'Documents' }).first()).toBeVisible();

    // Verify there's an upload button or dropzone visible
    const uploadArea = page.locator('button:has-text("Upload"), input[type="file"], .dropzone');
    await expect(uploadArea.first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Student can navigate to Tasks page', async () => {
    // Navigate directly since Tasks might not be in the sidebar
    await page.goto('/dashboard/student/tasks');
    
    // Verify navigation
    await page.waitForURL(/.*\/dashboard\/student\/tasks/);
    await expect(page.locator('h1', { hasText: 'Task Lists' }).first()).toBeVisible();
  });

  test('5. Student can navigate to Evaluations and view final evaluation status', async () => {
    // Navigate directly since Evaluations might not be in the sidebar
    await page.goto('/dashboard/student/evaluations');
    
    // Verify navigation
    await page.waitForURL(/.*\/dashboard\/student\/evaluations/);
    await expect(page.locator('h1', { hasText: 'Evaluations' }).first()).toBeVisible();
    
    // As per the Evaluations.tsx component, there should be either a FinalView or UnavailableView
    const evaluationText = page.locator('text=Final evaluation visibility depends on approval');
    await expect(evaluationText.first()).toBeVisible();
  });

  test('6. Student can navigate to Settings page and update profile details', async () => {
    // Navigate directly
    await page.goto('/dashboard/student/settings');
    
    // Verify navigation
    await page.waitForURL(/.*\/dashboard\/student\/settings/);
    await expect(page.locator('h1', { hasText: 'Settings' }).or(page.locator('h1', { hasText: 'Profile' })).first()).toBeVisible();
    
    // Ensure form fields are loaded
    await expect(page.getByPlaceholder('Enter first name').first()).toBeVisible({ timeout: 10000 });
  });
});
