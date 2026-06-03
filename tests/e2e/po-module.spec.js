// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PO Module', () => {
  test('happy path: create draft PO then submit successfully', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
    await expect(page.getByText(/Loaded \d+ approved PR open lines\./)).toBeVisible();

    await page.getByLabel('Vendor').fill('E2E Vendor Happy Path');

    const qtyInputs = page.getByLabel(/Order quantity for/i);
    const firstQtyInput = qtyInputs.first();
    await expect(firstQtyInput).toBeVisible();
    await firstQtyInput.fill('1');

    await page.getByRole('button', { name: 'Save As Draft' }).click();

    const draftMessage = page.locator('.po-message-success');
    await expect(draftMessage).toContainText('saved as DRAFT');
    await expect(draftMessage).toContainText(/PO-\d{4}-\d{4}/);

    await page.getByRole('button', { name: 'Submit PO' }).click();

    const submitMessage = page.locator('.po-message-success');
    await expect(submitMessage).toContainText('submitted successfully');
    await expect(submitMessage).toContainText(/PO-\d{4}-\d{4}/);
    await expect(page.locator('.po-message-error')).toHaveCount(0);
  });

  test('negative path: over-allocation is blocked with clear validation message', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
    await expect(page.getByText(/Loaded \d+ approved PR open lines\./)).toBeVisible();

    await page.getByLabel('Vendor').fill('E2E Vendor Over Allocation');

    const qtyInputs = page.getByLabel(/Order quantity for/i);
    const firstQtyInput = qtyInputs.first();
    await expect(firstQtyInput).toBeVisible();

    const allowedRemaining = Number(await firstQtyInput.getAttribute('max'));
    expect(Number.isNaN(allowedRemaining)).toBe(false);

    await firstQtyInput.fill(String(allowedRemaining + 1));
    await page.getByRole('button', { name: 'Save As Draft' }).click();

    const errorMessage = page.locator('.po-message-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Validation failed: allocation qty');
    await expect(errorMessage).toContainText('exceeds remaining');

    await expect(page.locator('.po-message-success')).toHaveCount(0);
  });
});
