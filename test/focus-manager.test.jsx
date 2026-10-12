import { test, expect } from '@playwright/experimental-ct-react';

import { FocusManagerFixture, FocusManagerItemsFixture } from './fixtures/focus-manager-fixture';

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

test.describe('itemSelector', () => {
	test('Shift+Tab from a control within an item returns to the item\'s candidate', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const itemA = component.locator('[data-value="a"]');
		const controlA = component.locator('[data-control="a"]');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await expect(itemA).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(controlA).toBeFocused();

		await page.keyboard.press('Shift+Tab');
		await expect(itemA).toBeFocused();
		await expect(itemA).toHaveAttribute('tabindex', '-2');

		await page.keyboard.press('Shift+Tab');
		await expect(component.getByTestId('before')).toBeFocused();
	});

	test('arrow keys from a control within an item move from the item\'s candidate', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const itemA = component.locator('[data-value="a"]');
		const itemB = component.locator('[data-value="b"]');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(component.locator('[data-control="a"]')).toBeFocused();

		await page.keyboard.press('ArrowRight');
		await expect(itemB).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(component.locator('[data-control="b"]')).toBeFocused();

		await page.keyboard.press('ArrowLeft');
		await expect(itemA).toBeFocused();
	});

	test('a control focused from outside keeps focus and belongs to its item', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const itemC = component.locator('[data-value="c"]');
		const controlC = component.locator('[data-control="c"]');

		// remember item B first, so a redirect would have somewhere to go
		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await expect(component.locator('[data-value="b"]')).toBeFocused();
		await component.getByTestId('outside').click();

		// a single focus() call; locator.focus() focuses twice, which would hide a redirect
		await controlC.evaluate(el => el.focus());
		await expect(controlC).toBeFocused();

		await page.keyboard.press('Shift+Tab');
		await expect(itemC).toBeFocused();
	});

	test('tabbing back in returns to the item whose control had focus', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const outside = component.getByTestId('outside');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await outside.click();

		await component.locator('[data-control="c"]').evaluate(el => el.focus());
		await outside.click();

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await expect(component.locator('[data-value="c"]')).toBeFocused();
	});

	test('leaving the container from a control takes the item\'s candidate out of the tab order', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const itemA = component.locator('[data-value="a"]');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(component.locator('[data-control="a"]')).toBeFocused();

		await component.getByTestId('outside').click();
		await expect(itemA).toHaveAttribute('tabindex', '-2');
	});

	test('a deferred autofocus doesn\'t take the tab stop from a control focused after it', async ({ mount }) => {
		// control A autofocuses before the container's ref is attached, which defers its handling, and a layout
		// effect then focuses control C
		const component = await mount(<FocusManagerItemsFixture autoFocusControl="a" layoutFocusControl="c" />);

		const page = component.page();
		const itemC = component.locator('[data-value="c"]');

		await expect(component.locator('[data-control="c"]')).toBeFocused();
		// let the deferred handling run
		await page.evaluate(() => new Promise(resolve => setTimeout(resolve)));
		await expect(component.locator('[data-value="a"]')).toHaveAttribute('tabindex', '-2');

		await page.keyboard.press('Shift+Tab');
		await expect(itemC).toBeFocused();
	});

	test('a deferred autofocus doesn\'t replace the item of a control focused after it', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture autoFocusControl="a" layoutFocusControl="c" />);

		const page = component.page();

		await expect(component.locator('[data-control="c"]')).toBeFocused();
		await page.evaluate(() => new Promise(resolve => setTimeout(resolve)));
		await component.getByTestId('outside').click();

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await expect(component.locator('[data-value="c"]')).toBeFocused();
	});
});

test.describe('receiveMouseDown', () => {
	test('a press on a non-focusable part of the container keeps focus on the container', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const itemB = component.locator('[data-value="b"]');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await expect(itemB).toBeFocused();
		await component.getByTestId('outside').click();

		await component.getByText('Description of C').click();
		await expect(component.getByTestId('list')).toBeFocused();
		await expect(itemB).not.toBeFocused();
	});

	test('tabbing in after a press on the container still moves to the last focused item', async ({ mount }) => {
		const component = await mount(<FocusManagerItemsFixture />);

		const page = component.page();
		const outside = component.getByTestId('outside');
		const description = component.getByText('Description of C');

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await outside.click();

		// the second press lands on the already focused container, so no focus event follows it
		await description.click();
		await description.click();
		await outside.click();

		await component.getByTestId('before').focus();
		await page.keyboard.press('Tab');
		await expect(component.locator('[data-value="b"]')).toBeFocused();
	});
});
