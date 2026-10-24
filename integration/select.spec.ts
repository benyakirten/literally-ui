import { expect, test } from '@playwright/test';

const stories = {
  single: '/iframe.html?id=select--default&viewMode=story',
  multiple: '/iframe.html?id=select--multiple&viewMode=story',
};

test('single select exposes combobox semantics and commits only on confirmation', async ({
  page,
}) => {
  await page.goto(stories.single);

  const input = page.locator('lu-select-input');

  await expect(page.getByRole('combobox', { name: 'Country' })).toBeVisible();
  await input.focus();
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input.locator('[part="indicator"]')).not.toHaveCSS(
    'transform',
    'none',
  );
  await input.press('ArrowDown');
  await input.press('Escape');
  await expect(input).toHaveJSProperty('value', '');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveJSProperty('value', 'ca');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('multiple select toggles options and submits repeated form entries', async ({
  page,
}) => {
  await page.goto(stories.multiple);
  const input = page.locator('lu-select-input');
  await expect(page.getByRole('button', { name: 'Fruits' })).toBeVisible();
  await input.click();

  const listbox = page.getByRole('listbox', { name: 'Fruits' });
  await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
  await listbox.press('Space');
  await listbox.press('ArrowDown');
  await listbox.press('Space');
  await expect(input).toHaveJSProperty('values', ['apple', 'pear']);
  await expect(input.locator('[part="chip"]')).toHaveCount(2);
  const submitted = await page
    .locator('form')
    .evaluate((form) => new FormData(form).getAll('fruit'));
  expect(submitted).toEqual(['apple', 'pear']);
});

test('multiple select toggles options by pointer without closing', async ({
  page,
}) => {
  await page.goto(stories.multiple);
  const input = page.locator('lu-select-input');
  await input.click();
  const apple = page.locator('lu-select-option[value="apple"]');
  const pear = page.locator('lu-select-option[value="pear"]');
  await apple.click();
  await expect(apple).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await pear.click();
  await expect(pear).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveJSProperty('values', ['apple', 'pear']);
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input.locator('[part="chip"]')).toHaveCount(2);
  await input.locator('[part="chip-remove"]').first().click();
  await expect(input).toHaveJSProperty('values', ['pear']);
  await expect(input.locator('[part="chip"]')).toHaveCount(1);
  await expect(input).toHaveAttribute('aria-expanded', 'true');
});

test('disabled options cannot become selected by pointer', async ({ page }) => {
  await page.goto(stories.single);
  const input = page.locator('lu-select-input');
  await input.click();
  const unavailable = page.locator('lu-select-option[value="mx"]');
  await unavailable.evaluate((option) => {
    option.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
  });
  await expect(unavailable).toHaveAttribute('aria-selected', 'false');
  await expect(input).toHaveJSProperty('value', '');
});

test('long-list story renders a scrollable set of options', async ({
  page,
}) => {
  await page.goto('/iframe.html?id=select--long-list&viewMode=story');
  await expect(page.getByRole('combobox', { name: 'City' })).toBeVisible();
  await page.locator('lu-select-input').click();
  await expect(page.getByRole('option', { name: 'City 30' })).toBeAttached();
});
