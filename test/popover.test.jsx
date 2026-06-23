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

test('A disabled popover renders a disabled trigger and does not open', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledPopover disabled>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');

	// The trigger reflects the disabled state (native disabled + class), so it is non-interactive
	// rather than a fully-enabled control whose clicks are silently swallowed.
	await expect(trigger).toBeDisabled();
	await expect(trigger).toHaveClass(/disabled/);
	await expect(dialog).toBeHidden();
});

test('With flip enabled and no room below, the popover renders above the trigger', async ({ mount }) => {
	const component = await mount(
		<div style={{ position: 'fixed', left: '8px', bottom: '8px' }}>
			<UncontrolledPopover placement="bottom-start" flip>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Body content</PopoverBody>
				</PopoverDialog>
			</UncontrolledPopover>
		</div>
	);

	const trigger = component.getByRole('button', { name: 'Open' });
	const dialog = component.locator('.popover');

	await trigger.click();
	await expect(dialog).toBeVisible();

	// The side class follows the resolved placement, so a flipped popover is styled as `popover-top`
	// rather than the requested `popover-bottom`.
	await expect(dialog).toHaveClass(/popover-top/);
	await expect(dialog).not.toHaveClass(/popover-bottom/);
});

test('A controlled popover autofocuses its content when opened via props', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<Popover isOpen={false}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>
						<input type="text" aria-label="field" />
					</PopoverBody>
				</PopoverDialog>
			</Popover>
		</div>
	);

	const dialog = component.locator('.popover');
	const input = component.getByRole('textbox', { name: 'field' });

	await expect(dialog).toBeHidden();

	// Opened purely through a props update -- no trigger interaction -- focus still moves to the content.
	await component.update(
		<div className="container">
			<Popover isOpen={true}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>
						<input type="text" aria-label="field" />
					</PopoverBody>
				</PopoverDialog>
			</Popover>
		</div>
	);

	await expect(dialog).toBeVisible();
	await expect(input).toBeFocused();
});

test('Closing by clicking a non-focusable area outside returns focus to the trigger', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<div style={{ width: '120px', height: '60px' }}>outside area</div>
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
	const outside = component.getByText('outside area');

	await trigger.click();
	await expect(dialog).toBeVisible();
	await expect(input).toBeFocused();

	// Focus was inside the dialog, so dismissing via an outside click restores it to the trigger.
	await outside.click();
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('A centered popover aligns its arrow with the trigger centre', async ({ mount }) => {
	const component = await mount(
		<div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<Popover isOpen placement="bottom" autoFocus={false}>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverDialog aria-label="Example">
					<PopoverBody>Centered popover content</PopoverBody>
				</PopoverDialog>
			</Popover>
		</div>
	);

	const dialog = component.locator('.popover');
	const arrow = component.locator('.popover-arrow');
	const trigger = component.getByRole('button', { name: 'Open' });

	await expect(dialog).toBeVisible();
	await expect(dialog).toHaveClass(/popover-bottom/);

	// Regression test for the arrow being shifted by mismatched CSS margin and floating-ui arrow padding
	const arrowBox = await arrow.boundingBox();
	const triggerBox = await trigger.boundingBox();
	const arrowCentre = arrowBox.x + arrowBox.width / 2;
	const triggerCentre = triggerBox.x + triggerBox.width / 2;

	expect(Math.abs(arrowCentre - triggerCentre)).toBeLessThan(1);
});

test('Reopening after a full cycle autofocuses and restores focus each time', async ({ mount }) => {
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

	// First cycle: keyboard open focuses content, Escape restores focus to the trigger.
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(dialog).toBeVisible();
	await expect(input).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();

	// Second cycle: the focus latch must re-arm on the new open edge and the close edge must restore
	// focus again -- i.e. nothing was left stuck after the first cycle.
	await page.keyboard.press('Enter');
	await expect(dialog).toBeVisible();
	await expect(input).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
});
