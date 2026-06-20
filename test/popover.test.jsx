import { test, expect } from '@playwright/experimental-ct-react';

import { Popover, PopoverTrigger, PopoverDialog, PopoverHeader, PopoverBody, UncontrolledPopover } from '../components';

test('Shows a basic uncontrolled popover', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledPopover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverHeader>Heading</PopoverHeader>
					<PopoverBody>Popover content</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');

	await expect(dialog).toBeHidden();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await trigger.click();

	await expect(dialog).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(component.getByText('Popover content')).toBeVisible();

	// The trigger's aria-controls references the dialog, and an arrow is rendered by default
	const dialogId = await dialog.getAttribute('id');
	await expect(trigger).toHaveAttribute('aria-controls', dialogId);
	await expect(component.locator('.popover-arrow')).toHaveCount(1);
});

test('Controlled popover follows the isOpen prop', async ({ mount }) => {
	let toggleCount = 0;

	const component = await mount(
		<div className="container">
			<Popover isOpen={false} onToggle={() => { toggleCount++; }}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</Popover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');

	await expect(dialog).toBeHidden();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	// Clicking the trigger should not open the popover (controlled) but should call onToggle
	await trigger.click();
	await expect(dialog).toBeHidden();
	expect(toggleCount).toBe(1);

	// Opening via a props update
	await component.update(
		<div className="container">
			<Popover isOpen={true} onToggle={() => { toggleCount++; }}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</Popover>
		</div>
	);

	await expect(dialog).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(component.getByText('Body content')).toBeVisible();
});

test('Opens with the keyboard, focuses content, Escape closes and restores focus', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledPopover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>
						<input type="text" aria-label="field" />
					</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');
	const input = component.getByRole('textbox', { name: 'field' });
	const page = component.page();

	// Enter opens the popover and focus moves to the first focusable element
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(dialog).toBeVisible();
	await expect(input).toBeFocused();

	// Escape closes the popover and returns focus to the trigger
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('Click outside closes the popover', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<button>Outside</button>
			<UncontrolledPopover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const outside = component.getByRole('button', { name: 'Outside' });
	const dialog = component.locator('.popover');

	await trigger.click();
	await expect(dialog).toBeVisible();

	await outside.click();
	await expect(dialog).toBeHidden();
});

test('dismissOnOutsideClick=false keeps the popover open', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<button>Outside</button>
			<UncontrolledPopover dismissOnOutsideClick={false}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const outside = component.getByRole('button', { name: 'Outside' });
	const dialog = component.locator('.popover');

	await trigger.click();
	await expect(dialog).toBeVisible();

	await outside.click();
	await expect(dialog).toBeVisible();
});

test('trapFocus keeps Tab within the dialog', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<button>Before</button>
			<UncontrolledPopover trapFocus>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>
						<button>First</button>
						<button>Second</button>
					</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
			<button>After</button>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');
	const first = component.getByRole('button', { name: 'First' });
	const second = component.getByRole('button', { name: 'Second' });
	const page = component.page();

	await trigger.click();
	await expect(dialog).toBeVisible();
	await expect(first).toBeFocused();

	await page.keyboard.press('Tab');
	await expect(second).toBeFocused();

	// Tabbing past the last focusable wraps back to the first (focus is trapped)
	await page.keyboard.press('Tab');
	await expect(first).toBeFocused();
});
