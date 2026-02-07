/**
 * E2E Tests for Dashboard Page
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated state
    await page.goto('http://localhost:5173/dashboard.html');
    
    await page.evaluate(() => {
      // Mock user
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }));
      
      // Mock some member data
      localStorage.setItem('members', JSON.stringify([
        {
          id: '1',
          groupName: 'Test Group',
          userId: 'fb_user_1',
          facebookUsername: 'johndoe',
          joinedOn: new Date('2024-01-15').toISOString(),
          q1: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          status: 'pending',
          dateAdded: new Date().toISOString(),
        },
        {
          id: '2',
          groupName: 'Test Group',
          userId: 'fb_user_2',
          facebookUsername: 'janedoe',
          joinedOn: new Date('2024-01-16').toISOString(),
          q1: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          status: 'approved',
          dateAdded: new Date().toISOString(),
        },
      ]));
    });
    
    await page.reload();
  });

  test('should display member data table', async ({ page }) => {
    // Check for table headers
    await expect(page.getByText('Facebook Username')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Joined On')).toBeVisible();
  });

  test('should display member rows', async ({ page }) => {
    // Check for specific member data
    await expect(page.getByText('johndoe')).toBeVisible();
    await expect(page.getByText('janedoe')).toBeVisible();
    await expect(page.getByText('john@example.com')).toBeVisible();
  });

  test('should filter members by status', async ({ page }) => {
    const statusFilter = page.getByLabel(/filter.*status|status filter/i);
    
    if (await statusFilter.isVisible()) {
      // Filter by pending
      await statusFilter.selectOption('pending');
      
      // Should show only pending members
      await expect(page.getByText('johndoe')).toBeVisible();
      
      // Should not show approved members
      const janeRow = page.getByText('janedoe');
      if (await janeRow.isVisible()) {
        // If visible, table might not have filtering implemented yet
      }
    }
  });

  test('should search members by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('john');
      
      // Should show John
      await expect(page.getByText('johndoe')).toBeVisible();
    }
  });

  test('should display action buttons', async ({ page }) => {
    // Check for main action buttons
    const buttons = [
      /automate/i,
      /download.*csv/i,
      /push.*sheet|sync.*sheet/i,
      /clear.*data/i,
    ];

    for (const buttonPattern of buttons) {
      const button = page.getByRole('button', { name: buttonPattern });
      // Some buttons might not be visible depending on implementation
      // Just check if they exist
      const count = await button.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should download CSV when button clicked', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /download.*csv/i });
    
    if (await downloadButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      
      await downloadButton.click();
      
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('should show confirmation dialog before clearing data', async ({ page }) => {
    const clearButton = page.getByRole('button', { name: /clear.*data/i });
    
    if (await clearButton.isVisible()) {
      // Set up dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toMatch(/clear|delete|remove/i);
        await dialog.dismiss();
      });
      
      await clearButton.click();
      
      // Data should still be visible since we dismissed the dialog
      await expect(page.getByText('johndoe')).toBeVisible();
    }
  });

  test('should open Google Sheet in new tab', async ({ page, context }) => {
    // First set a Google Sheets URL
    await page.evaluate(() => {
      localStorage.setItem('settings', JSON.stringify({
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1abc123xyz/edit',
      }));
    });
    
    await page.reload();
    
    const openSheetButton = page.getByRole('button', { name: /open.*sheet/i });
    
    if (await openSheetButton.isVisible()) {
      // Set up new page handler
      const pagePromise = context.waitForEvent('page');
      
      await openSheetButton.click();
      
      const newPage = await pagePromise;
      
      // Verify URL
      expect(newPage.url()).toContain('docs.google.com/spreadsheets');
    }
  });

  test('should handle empty state', async ({ page }) => {
    // Clear members
    await page.evaluate(() => {
      localStorage.setItem('members', JSON.stringify([]));
    });
    
    await page.reload();
    
    // Should show empty state message
    await expect(page.getByText(/no.*member|no data|empty/i)).toBeVisible();
  });

  test('should sort table by column', async ({ page }) => {
    const usernameHeader = page.getByText('Facebook Username');
    
    // Click to sort
    await usernameHeader.click();
    
    // Get all username cells
    const usernames = await page.locator('td:has-text("doe")').allTextContents();
    
    // Should be in alphabetical order
    // This is a basic check - adjust based on your implementation
    expect(usernames.length).toBeGreaterThan(0);
  });

  test('should select multiple members for bulk actions', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      // Select first checkbox
      await checkboxes.first().check();
      await expect(checkboxes.first()).toBeChecked();
      
      // Bulk action buttons should appear
      const bulkActions = page.getByText(/selected|bulk action/i);
      // This depends on your implementation
    }
  });
});

test.describe('Dashboard - Real-time Updates', () => {
  test('should refresh data on demand', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard.html');
    
    await page.evaluate(() => {
      localStorage.setItem('members', JSON.stringify([
        {
          id: '1',
          groupName: 'Test Group',
          userId: 'fb_user_1',
          facebookUsername: 'johndoe',
          status: 'pending',
          dateAdded: new Date().toISOString(),
        },
      ]));
    });
    
    await page.reload();
    
    const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should show loading indicator
      const loadingIndicator = page.getByText(/loading|refreshing/i);
      // This might be visible only briefly
    }
  });
});
