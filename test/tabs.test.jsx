import { test, expect } from '@playwright/experimental-ct-react';

import { Tab, Tabs, TabPane } from '../components';

test('Renders tabs with correct ARIA roles', async ({ mount }) => {
	const component = await mount(
		<div>
			<Tabs>
				<Tab onActivate={() => {}} aria-controls="panel-1" isActive>Tab 1</Tab>
				<Tab onActivate={() => {}} aria-controls="panel-2">Tab 2</Tab>
			</Tabs>
			<TabPane id="panel-1" isActive>Content 1</TabPane>
			<TabPane id="panel-2">Content 2</TabPane>
		</div>
	);

	await expect(component.getByRole('tablist')).toBeVisible();
	await expect(component.getByRole('tab')).toHaveCount(2);
	await expect(component.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
	await expect(component.getByRole('tab', { name: 'Tab 1' })).toHaveClass(/active/);
	await expect(component.getByRole('tab', { name: 'Tab 2' })).not.toHaveClass(/active/);
	await expect(component.locator('[role="tabpanel"]')).toHaveCount(2);
	await expect(component.getByRole('tabpanel')).toHaveText('Content 1');
});

test('Clicking a tab calls onActivate', async ({ mount }) => {
	let activatedTab = null;

	const component = await mount(
		<div>
			<Tabs>
				<Tab onActivate={() => { activatedTab = 1; }} isActive>Tab 1</Tab>
				<Tab onActivate={() => { activatedTab = 2; }}>Tab 2</Tab>
			</Tabs>
		</div>
	);

	await component.getByRole('tab', { name: 'Tab 2' }).click();
	expect(activatedTab).toBe(2);

	// Update to reflect new active state
	await component.update(
		<div>
			<Tabs>
				<Tab onActivate={() => { activatedTab = 1; }}>Tab 1</Tab>
				<Tab onActivate={() => { activatedTab = 2; }} isActive>Tab 2</Tab>
			</Tabs>
		</div>
	);

	await expect(component.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
	await expect(component.getByRole('tab', { name: 'Tab 2' })).toHaveClass(/active/);
	await expect(component.getByRole('tab', { name: 'Tab 1' })).not.toHaveClass(/active/);

	// Click Tab 1 to switch back
	await component.getByRole('tab', { name: 'Tab 1' }).click();
	expect(activatedTab).toBe(1);
});

test('Disabled tab does not call onActivate', async ({ mount }) => {
	let activateCount = 0;

	const component = await mount(
		<div>
			<Tabs>
				<Tab onActivate={() => {}} isActive>Tab 1</Tab>
				<Tab onActivate={() => { activateCount++; }} isDisabled>Tab 2</Tab>
			</Tabs>
		</div>
	);

	await component.getByRole('tab', { name: 'Tab 2' }).click();
	expect(activateCount).toBe(0);
	await expect(component.getByRole('tab', { name: 'Tab 2' })).toHaveClass(/disabled/);
});

test('Keyboard navigation with ArrowRight and ArrowLeft', async ({ mount }) => {
	const component = await mount(
		<div>
			<Tabs>
				<Tab onActivate={() => {}} isActive>Tab 1</Tab>
				<Tab onActivate={() => {}}>Tab 2</Tab>
				<Tab onActivate={() => {}}>Tab 3</Tab>
			</Tabs>
		</div>
	);

	const page = component.page();
	const tab1 = component.getByRole('tab', { name: 'Tab 1' });
	const tab2 = component.getByRole('tab', { name: 'Tab 2' });
	const tab3 = component.getByRole('tab', { name: 'Tab 3' });

	// Click the active tab to give it focus
	await tab1.click();
	await expect(tab1).toBeFocused();

	// ArrowRight moves focus to next tab
	await page.keyboard.press('ArrowRight');
	await expect(tab2).toBeFocused();

	await page.keyboard.press('ArrowRight');
	await expect(tab3).toBeFocused();

	// ArrowLeft moves focus back
	await page.keyboard.press('ArrowLeft');
	await expect(tab2).toBeFocused();

	await page.keyboard.press('ArrowLeft');
	await expect(tab1).toBeFocused();
});

test('activateOnFocus calls onActivate on arrow key navigation', async ({ mount }) => {
	let activateCount = 0;

	const component = await mount(
		<div>
			<Tabs activateOnFocus>
				<Tab onActivate={() => { activateCount++; }} isActive>Tab 1</Tab>
				<Tab onActivate={() => { activateCount++; }}>Tab 2</Tab>
				<Tab onActivate={() => { activateCount++; }}>Tab 3</Tab>
			</Tabs>
		</div>
	);

	const page = component.page();

	// Click the active tab then navigate with arrows
	await component.getByRole('tab', { name: 'Tab 1' }).click();
	// Click calls onActivate, reset counter
	activateCount = 0;

	await page.keyboard.press('ArrowRight');
	expect(activateCount).toBe(1);

	await page.keyboard.press('ArrowRight');
	expect(activateCount).toBe(2);
});

test('TabPane shows loading spinner', async ({ mount }) => {
	const component = await mount(
		<div>
			<TabPane isActive isLoading>Content</TabPane>
		</div>
	);

	await expect(component.locator('.tab-pane')).toHaveClass(/loading/);
	await expect(component.getByRole('progressbar')).toBeVisible();
	await expect(component.getByText('Content')).toHaveCount(0);
});