import { test, expect } from '@playwright/experimental-ct-react';

import { FocusManagerFixture } from './fixtures/focus-manager-fixture';

test('receiveFocus redirects focus to first item', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');

	// Tab from the "Before" button into the toolbar
	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnA).toBeFocused();
});

test('receiveFocus skips disabled items', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture disableFirst />);

	const page = component.page();
	const btnB = component.locator('[data-value="b"]');

	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnB).toBeFocused();
});

test('receiveFocus uses initialQuerySelector', async ({ mount }) => {
	const component = await mount(
		<FocusManagerFixture initialQuerySelector='[data-value="b"]' />
	);

	const page = component.page();
	const btnB = component.locator('[data-value="b"]');

	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnB).toBeFocused();
});

test('receiveFocus remembers last focused element', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');
	const btnB = component.locator('[data-value="b"]');
	const outside = component.getByTestId('outside');

	// Tab into the toolbar, A gets focus, then ArrowRight to B
	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnA).toBeFocused();

	await page.keyboard.press('ArrowRight');
	await expect(btnB).toBeFocused();

	// Blur by clicking outside
	await outside.click();
	await expect(btnB).not.toBeFocused();

	// Re-focus the toolbar via Tab, should remember B
	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnB).toBeFocused();
});

test('receiveBlur restores tabIndex', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture />);

	const page = component.page();
	const toolbar = component.getByTestId('toolbar');
	const outside = component.getByTestId('outside');

	await expect(toolbar).toHaveAttribute('tabindex', '0');

	// Focus toolbar: tabIndex changes to -1
	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(toolbar).toHaveAttribute('tabindex', '-1');

	// Blur: tabIndex restored to 0
	await outside.click();
	await expect(toolbar).toHaveAttribute('tabindex', '0');
});

test('focusNext moves focus through items', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture isCarousel={false} />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');
	const btnB = component.locator('[data-value="b"]');
	const btnC = component.locator('[data-value="c"]');

	// Tab into the toolbar to focus the first item
	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnA).toBeFocused();

	await page.keyboard.press('ArrowRight');
	await expect(btnB).toBeFocused();

	await page.keyboard.press('ArrowRight');
	await expect(btnC).toBeFocused();

	// Should not wrap around
	await page.keyboard.press('ArrowRight');
	await expect(btnC).toBeFocused();
});

test('focusNext wraps around (carousel)', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');
	const btnC = component.locator('[data-value="c"]');

	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(btnC).toBeFocused();

	// Wrap around to A
	await page.keyboard.press('ArrowRight');
	await expect(btnA).toBeFocused();
});

test('focusPrev moves focus backwards', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture isCarousel={false} />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');
	const btnB = component.locator('[data-value="b"]');
	const btnC = component.locator('[data-value="c"]');

	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(btnC).toBeFocused();

	await page.keyboard.press('ArrowLeft');
	await expect(btnB).toBeFocused();

	await page.keyboard.press('ArrowLeft');
	await expect(btnA).toBeFocused();

	// Should not wrap around
	await page.keyboard.press('ArrowLeft');
	await expect(btnA).toBeFocused();
});

test('focusPrev wraps around (carousel)', async ({ mount }) => {
	const component = await mount(<FocusManagerFixture />);

	const page = component.page();
	const btnA = component.locator('[data-value="a"]');
	const btnC = component.locator('[data-value="c"]');

	await component.getByTestId('before').focus();
	await page.keyboard.press('Tab');
	await expect(btnA).toBeFocused();

	// Wrap around to C
	await page.keyboard.press('ArrowLeft');
	await expect(btnC).toBeFocused();
});

test('focusBySelector focuses element matching selector', async ({ mount }) => {
	const component = await mount(
		<FocusManagerFixture focusByQuery='[data-value="b"]' />
	);

	const btnB = component.locator('[data-value="b"]');
	const focusBy = component.getByTestId('focus-by');

	await focusBy.click();
	await expect(btnB).toBeFocused();
});
