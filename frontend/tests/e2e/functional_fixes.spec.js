import { test, expect } from '@playwright/test';

test.describe('Functional Fixes Verification', () => {

    test('User cannot access protected admin routes without login', async ({ page }) => {
        // Navigate to a protected admin route
        await page.goto('/admin/settings');

        // Should redirect to login or show access denied
        // Check for URL containing login OR text "Login"
        await expect(page).toHaveURL(/.*login/);
        await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible();
    });

    test('Blog page loads with pagination controls and search', async ({ page }) => {
        test.setTimeout(60000);
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveTitle(/Blog/i);

        // Check for Search input which is always present
        await expect(page.getByPlaceholderText(/Search/i)).toBeVisible();

        // Check for "Previous" button (pagination)
        await expect(page.getByRole('button', { name: 'Prev' })).toBeVisible();
    });

    test('Academy Events page loads', async ({ page }) => {
        await page.goto('/academy');
        await expect(page).toHaveTitle(/Academy/i);

        // Check for "Upcoming Events" section header (likely h2 or text)
        // Using getByRole heading or text
        const upcomingHeader = page.getByRole('heading', { name: /Events/i }).first();
        // Or generic text if heading level varies
        const upcomingText = page.getByText(/Events/i).first();

        await expect(upcomingHeader.or(upcomingText)).toBeVisible();
    });

    test('Company Reviews list loads', async ({ page }) => {
        await page.goto('/reviews');

        // Check for main header "Compare Trading Companies"
        await expect(page.getByRole('heading', { name: /Compare/i }).first()).toBeVisible();

        // Check for at least one card (Company card OR "Write to Us" card which is always there)
        const cards = page.locator('.card');
        await expect(cards.first()).toBeVisible();
    });

    test('Public user cannot see "Edit Review" buttons', async ({ page }) => {
        await page.goto('/reviews');
        // Edit/Delete buttons should NOT be visible for unauthenticated user
        const editBtn = page.getByRole('button', { name: /Edit/i });
        const deleteBtn = page.getByRole('button', { name: /Delete/i });

        await expect(editBtn).not.toBeVisible();
        await expect(deleteBtn).not.toBeVisible();
    });
});
