// @ts-check
import { test, expect } from '@playwright/test';

test('homepage has title and links to academy', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/XK Trading/i);

    // Check if Academy link exists 
    // We use a more lenient locator to ensure it finds it
    const academyLink = page.getByRole('link', { name: /academy/i }).first();
    await expect(academyLink).toBeVisible();
});

test('review page loads', async ({ page }) => {
    await page.goto('/reviews');
    // Check for some header or element on review page
    await expect(page.getByText(/Reviews/i).first()).toBeVisible();
});

test('login page loads', async ({ page }) => {
    await page.goto('/login');
    // Check for Sign In button
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
});
