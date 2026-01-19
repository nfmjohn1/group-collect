/**
 * E2E Tests for Authentication Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the extension popup (you'll need to adjust this for your setup)
    await page.goto('http://localhost:5173/popup.html');
  });

  test('should display login page by default', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByText('Login')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    const loginButton = page.getByRole('button', { name: /sign in|login/i });

    // Enter invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await loginButton.click();

    // Should show validation error
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click signup link
    await page.getByText(/sign up|create account/i).click();

    // Should show signup form
    await expect(page.getByText(/create account|sign up/i)).toBeVisible();
  });

  test('should show validation errors for weak password', async ({ page }) => {
    // Navigate to signup
    await page.getByText(/sign up|create account/i).click();

    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    const signupButton = page.getByRole('button', { name: /sign up|create account/i });

    // Enter valid email but weak password
    await emailInput.fill('test@example.com');
    await passwordInput.fill('123'); // Too short
    await signupButton.click();

    // Should show validation error
    await expect(page.getByText(/password.*6 characters|password too short/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Password');
    const toggleButton = page.getByRole('button', { name: /show|hide.*password/i });

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should display Google sign-in button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google|sign in with google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    const loginButton = page.getByRole('button', { name: /sign in|login/i });

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await loginButton.click();

    // Should show network error
    await expect(page.getByText(/network|offline|connection/i)).toBeVisible();

    // Restore online mode
    await page.context().setOffline(false);
  });
});

test.describe('Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated state using localStorage or mock API
    // This is a placeholder - adjust based on your auth implementation
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
  });

  test('should display user email on home page', async ({ page }) => {
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should have logout button', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();
  });

  test('should navigate between pages using sidebar', async ({ page }) => {
    // Navigate to Settings
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page.getByText(/settings|configuration/i)).toBeVisible();

    // Navigate to Message
    await page.getByRole('link', { name: /message/i }).click();
    await expect(page.getByText(/message template|welcome message/i)).toBeVisible();

    // Navigate to Links
    await page.getByRole('link', { name: /links/i }).click();
    await expect(page.getByText(/useful links|resources/i)).toBeVisible();

    // Navigate back to Home
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login page
    await expect(page.getByText('Login')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
  });
});
