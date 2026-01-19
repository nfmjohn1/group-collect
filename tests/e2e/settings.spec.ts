/**
 * E2E Tests for Settings Page
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/popup.html');
    
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }));
    });
    
    await page.reload();
    
    // Navigate to Settings
    await page.getByRole('link', { name: /settings/i }).click();
  });

  test('should display settings form', async ({ page }) => {
    await expect(page.getByText(/settings/i)).toBeVisible();
    await expect(page.getByLabel(/google sheet url/i)).toBeVisible();
  });

  test('should validate Google Sheets URL', async ({ page }) => {
    const urlInput = page.getByLabel(/google sheet url/i);
    const saveButton = page.getByRole('button', { name: /save/i });

    // Enter invalid URL
    await urlInput.fill('https://invalid-url.com');
    await saveButton.click();

    // Should show validation error
    await expect(page.getByText(/invalid.*sheet.*url|valid google sheets url/i)).toBeVisible();
  });

  test('should accept valid Google Sheets URL', async ({ page }) => {
    const urlInput = page.getByLabel(/google sheet url/i);
    const saveButton = page.getByRole('button', { name: /save/i });

    // Enter valid URL
    await urlInput.fill('https://docs.google.com/spreadsheets/d/1abc123xyz/edit');
    await saveButton.click();

    // Should show success message
    await expect(page.getByText(/saved|success/i)).toBeVisible();
  });

  test('should display group selector', async ({ page }) => {
    const groupSelect = page.getByLabel(/select group|facebook group/i);
    await expect(groupSelect).toBeVisible();
  });

  test('should toggle auto-decline feature', async ({ page }) => {
    const autoDeclineToggle = page.getByLabel(/auto.*decline|decline feature/i);
    await expect(autoDeclineToggle).toBeVisible();

    // Toggle on
    await autoDeclineToggle.click();
    await expect(autoDeclineToggle).toBeChecked();

    // Toggle off
    await autoDeclineToggle.click();
    await expect(autoDeclineToggle).not.toBeChecked();
  });

  test('should show confirmation dialog for enabling auto-decline', async ({ page }) => {
    const autoDeclineToggle = page.getByLabel(/auto.*decline|decline feature/i);
    
    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('decline');
      await dialog.accept();
    });

    await autoDeclineToggle.click();
  });

  test('should sync questions and answers', async ({ page }) => {
    // First set a Google Sheets URL
    const urlInput = page.getByLabel(/google sheet url/i);
    await urlInput.fill('https://docs.google.com/spreadsheets/d/1abc123xyz/edit');
    
    const syncButton = page.getByRole('button', { name: /sync.*question|sync.*answer/i });
    await expect(syncButton).toBeVisible();
    
    // Click sync button
    await syncButton.click();
    
    // Should show loading state
    await expect(page.getByText(/syncing|loading/i)).toBeVisible();
  });

  test('should persist settings across page navigations', async ({ page }) => {
    const urlInput = page.getByLabel(/google sheet url/i);
    const testUrl = 'https://docs.google.com/spreadsheets/d/1abc123xyz/edit';
    
    // Set a value
    await urlInput.fill(testUrl);
    await page.getByRole('button', { name: /save/i }).click();
    
    // Navigate away
    await page.getByRole('link', { name: /home/i }).click();
    
    // Navigate back to Settings
    await page.getByRole('link', { name: /settings/i }).click();
    
    // Value should be persisted
    await expect(urlInput).toHaveValue(testUrl);
  });
});

test.describe('Decline Rules Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/popup.html');
    
    await page.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }));
    });
    
    await page.reload();
    await page.getByRole('link', { name: /settings/i }).click();
    
    // Enable auto-decline feature
    const autoDeclineToggle = page.getByLabel(/auto.*decline/i);
    if (!await autoDeclineToggle.isChecked()) {
      page.on('dialog', dialog => dialog.accept());
      await autoDeclineToggle.click();
    }
  });

  test('should show decline rules when feature is enabled', async ({ page }) => {
    await expect(page.getByText(/decline.*rule|decline.*criteria/i)).toBeVisible();
  });

  test('should configure decline rule for missing email', async ({ page }) => {
    const missingEmailCheckbox = page.getByLabel(/decline.*missing.*email|no email/i);
    
    if (await missingEmailCheckbox.isVisible()) {
      await missingEmailCheckbox.click();
      await expect(missingEmailCheckbox).toBeChecked();
    }
  });

  test('should hide decline rules when feature is disabled', async ({ page }) => {
    const autoDeclineToggle = page.getByLabel(/auto.*decline/i);
    
    // Disable the feature
    await autoDeclineToggle.click();
    
    // Rules should be hidden
    const rulesSection = page.getByText(/decline.*rule/i);
    await expect(rulesSection).not.toBeVisible();
  });
});
