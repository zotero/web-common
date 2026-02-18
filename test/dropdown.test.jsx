import { test, expect } from '@playwright/experimental-ct-react';

import {DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown, Dropdown} from '../components';

test('Shows a basic uncontrolled dropdown', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledDropdown>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);

	const toggle = component.getByRole('button', { name: 'Click' });
	const menu = component.locator('.dropdown-menu');
	await expect(menu).toBeHidden();

	await toggle.click();

	await expect(menu).toBeVisible();
	await expect(component.getByText('Item 1')).toBeVisible();
	await expect(component.getByText('Item 2')).toBeVisible();
});

test('Basic dropdown interaction', async ({ mount }) => {
	let toggleCount = 0;
	let itemClickCount = 0;

	const component = await mount(
		<div className="container">
			<Dropdown isOpen={false} onToggle={() => { toggleCount++; }}>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => { itemClickCount++; }}>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		</div>
	);

	const menu = component.locator('.dropdown-menu');
	const toggle = component.getByRole('button', { name: 'Click' });

	// Menu should be hidden when isOpen is false
	await expect(menu).toBeHidden();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');

	// Clicking the toggle should not open the menu (controlled component) but should call onToggle
	await toggle.click();
	await expect(menu).toBeHidden();
	expect(toggleCount).toBe(1);

	// Open the dropdown via props update
	await component.update(
		<div className="container">
			<Dropdown isOpen={true} onToggle={() => { toggleCount++; }}>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => { itemClickCount++; }}>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		</div>
	);

	await expect(menu).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(component.getByText('Item 1')).toBeVisible();
	await expect(component.getByText('Item 2')).toBeVisible();

	// Clicking a DropdownItem should call onClick and onToggle, but a menu stays open (controlled)
	// Note: DropdownItem dispatches onToggle via setTimeout, so we poll for the async callback
	await component.getByText('Item 1').click();
	await expect(menu).toBeVisible();
	expect(itemClickCount).toBe(1);
	await expect.poll(() => toggleCount).toBe(2);

	// Clicking Item 2 (no onClick) should still call onToggle
	await component.getByText('Item 2').click();
	await expect(menu).toBeVisible();
	await expect.poll(() => toggleCount).toBe(3);
	expect(itemClickCount).toBe(1);
});

test('Keyboard navigation', async ({ mount }) => {
	let itemClickCount = 0;

	const component = await mount(
		<div className="container">
			<UncontrolledDropdown>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => { itemClickCount++; }}>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
					<DropdownItem>Item 3</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);

	const toggle = component.getByRole('button', { name: 'Click' });
	const menu = component.locator('.dropdown-menu');
	const item1 = component.getByRole('menuitem', { name: 'Item 1' });
	const item2 = component.getByRole('menuitem', { name: 'Item 2' });
	const item3 = component.getByRole('menuitem', { name: 'Item 3' });

	const page = component.page();
	await expect(toggle).not.toBeFocused();

	// Open the dropdown with Enter - focus auto-moves to the first item
	await toggle.focus();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await expect(item1).toBeFocused();

	// ArrowDown moves focus through items
	await page.keyboard.press('ArrowDown');
	await expect(item2).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(item3).toBeFocused();

	// ArrowUp moves focus back up
	await page.keyboard.press('ArrowUp');
	await expect(item2).toBeFocused();

	await page.keyboard.press('ArrowUp');
	await expect(item1).toBeFocused();

	// Enter on an item triggers onClick and closes the dropdown
	await page.keyboard.press('Enter');
	await expect.poll(() => itemClickCount).toBe(1);
	await expect(menu).toBeHidden();

	// Reopen for Escape test - Enter on toggle
	await expect(toggle).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();

	// Escape closes the dropdown and returns focus to toggle
	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(toggle).toBeFocused();
});

test('Keyboard navigation with portal', async ({ mount }) => {
	let itemClickCount = 0;

	const component = await mount(
		<div className="container">
			<UncontrolledDropdown portal>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => { itemClickCount++; }}>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
					<DropdownItem>Item 3</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);

	const page = component.page();
	const toggle = component.getByRole('button', { name: 'Click' });
	// Portal renders a menu in document.body, outside the component tree
	const menu = page.locator('.dropdown-menu');
	const item1 = page.getByRole('menuitem', { name: 'Item 1' });
	const item2 = page.getByRole('menuitem', { name: 'Item 2' });
	const item3 = page.getByRole('menuitem', { name: 'Item 3' });

	// Open the dropdown with Enter - focus auto-moves to the first item
	await toggle.focus();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();
	await expect(item1).toBeFocused();

	// ArrowDown moves focus through items
	await page.keyboard.press('ArrowDown');
	await expect(item2).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(item3).toBeFocused();

	// ArrowUp moves focus back up
	await page.keyboard.press('ArrowUp');
	await expect(item2).toBeFocused();

	await page.keyboard.press('ArrowUp');
	await expect(item1).toBeFocused();

	// Enter on an item triggers onClick and closes the dropdown
	await page.keyboard.press('Enter');
	await expect.poll(() => itemClickCount).toBe(1);
	await expect(menu).toBeHidden();

	// Reopen for Escape test - Enter on toggle
	await expect(toggle).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(menu).toBeVisible();

	// Escape closes the dropdown and returns focus to toggle
	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(toggle).toBeFocused();
});

test('Open with Space and ArrowDown', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledDropdown>
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem>Item 1</DropdownItem>
					<DropdownItem>Item 2</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);

	const toggle = component.getByRole('button', { name: 'Click' });
	const menu = component.locator('.dropdown-menu');
	const item1 = component.getByRole('menuitem', { name: 'Item 1' });
	const page = component.page();

	// Space opens the dropdown
	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(menu).toBeVisible();
	await expect(item1).toBeFocused();

	// Escape to close
	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(toggle).toBeFocused();

	// ArrowDown opens the dropdown
	await page.keyboard.press('ArrowDown');
	await expect(menu).toBeVisible();
	await expect(item1).toBeFocused();

	// Escape to close
	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(toggle).toBeFocused();
});

test('Supports strategy prop', async ({ mount }) => {
	const component = await mount(
		<div className="container">
			<UncontrolledDropdown strategy="fixed">
				<DropdownToggle>Click</DropdownToggle>
				<DropdownMenu>
					<DropdownItem>Item 1</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);

	const toggle = component.getByRole('button', { name: 'Click' });
	const menu = component.locator('.dropdown-menu');

	await toggle.click();
	await expect(menu).toBeVisible();
	await expect(menu).toHaveCSS('position', 'fixed');
});

