import { test, expect } from '@playwright/experimental-ct-react';

import { Select, SelectOption, SelectDivider } from '../components';

const options = [
	{ label: 'Foo', value: 'foo' },
	{ label: 'Bar', value: 'bar' },
	{ label: 'Lorem', value: 'lorem' },
	{ label: 'Ipsum', value: 'ipsum' },
];

test('Shows a basic select', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} />
		</div>
	);
	await expect(component.getByRole('combobox')).toBeVisible();
});

test('Clicking on the select opens/closes the listbox', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} />
		</div>
	);
	const combobox = component.getByRole('combobox');

	await combobox.click();
	const listbox = component.getByRole('listbox');
	await expect(listbox).toBeVisible();
	await expect(listbox.getByRole('option')).toHaveCount(options.length);

	await component.locator('.select-control').click();
	await expect(component.getByRole('listbox')).toHaveCount(0);
});

test('Clicking on an option fires onChange but not onBlur', async ({ mount }) => {
	let changeCount = 0;
	let changeValue = null;
	let blurCount = 0;

	const component = await mount(
		<div>
			<Select
				options={options}
				onChange={(v) => { changeCount++; changeValue = v; }}
				onBlur={() => { blurCount++; }}
			/>
		</div>
	);

	await component.getByRole('combobox').click();
	await component.getByRole('option', { name: 'Bar' }).click();
	expect(changeCount).toBe(1);
	expect(changeValue).toBe('bar');
	expect(blurCount).toBe(0);
});

test('Clicking on an already selected option fires neither onChange nor onBlur', async ({ mount }) => {
	let changeCount = 0;
	let blurCount = 0;

	const component = await mount(
		<div>
			<Select
				options={options}
				value="bar"
				onChange={() => { changeCount++; }}
				onBlur={() => { blurCount++; }}
			/>
		</div>
	);

	await component.getByRole('combobox').click();
	await component.getByRole('option', { name: 'Bar' }).click();
	expect(changeCount).toBe(0);
	expect(blurCount).toBe(0);
});

test('Fires onFocus and onBlur', async ({ mount }) => {
	let focusCount = 0;
	let blurCount = 0;

	const component = await mount(
		<div>
			<Select
				options={options}
				onFocus={() => { focusCount++; }}
				onBlur={() => { blurCount++; }}
			/>
			<button>Focus me</button>
		</div>
	);

	const page = component.page();
	const combobox = component.getByRole('combobox');
	const button = component.getByRole('button', { name: 'Focus me' });

	await combobox.click();
	expect(focusCount).toBe(1);
	await expect(combobox).toBeFocused();

	await page.keyboard.press('Tab');
	expect(blurCount).toBe(1);
	await expect(button).toBeFocused();

	await page.keyboard.press('Shift+Tab');
	await expect(combobox).toBeFocused();
	expect(focusCount).toBe(2);
	expect(blurCount).toBe(1);

	await page.mouse.click(0, 300);
	expect(focusCount).toBe(2);
	expect(blurCount).toBe(2);
	await expect(combobox).not.toBeFocused();
});

test('Should filter options', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await page.keyboard.type('lorem');
	const listbox = component.getByRole('listbox');
	await expect(listbox.getByRole('option')).toHaveCount(1);
	await expect(listbox.getByRole('option', { name: 'Lorem' })).toBeVisible();
});

test('If closed, should open as soon as filter is changed', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await component.locator('.select-control').click();
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect(component.locator('input')).toBeFocused();

	await page.keyboard.type('l');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(1);
});

test('Should clear filter input on blur, persist otherwise', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} />
			<button>Focus target</button>
		</div>
	);
	const page = component.page();
	const input = component.locator('input');

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(input).toHaveValue('');
	await expect(input).toBeFocused();

	await page.keyboard.type('lorem');
	await expect(input).toHaveValue('lorem');

	// Click to close - filter persists
	await component.locator('.select-control').click();
	await expect(input).toHaveValue('lorem');
	await expect(component.getByRole('listbox')).toHaveCount(0);

	// Click to reopen - filter persists
	await component.locator('.select-control').click();
	await expect(input).toHaveValue('lorem');
	await expect(component.getByRole('listbox')).toBeVisible();

	// Escape closes - filter persists
	await page.keyboard.press('Escape');
	await expect(input).toHaveValue('lorem');

	// Tab out then Shift+Tab back - blur clears the filter
	await page.keyboard.press('Tab');
	await page.keyboard.press('Shift+Tab');
	await expect(input).toHaveValue('');
});

test('Should clear filter input on escape', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} />
		</div>
	);
	const page = component.page();
	const input = component.locator('input');

	await component.getByRole('combobox').click();
	await page.keyboard.type('lorem');
	await expect(input).toHaveValue('lorem');
	await expect(component.getByRole('listbox')).toBeVisible();

	// First escape closes the listbox
	await page.keyboard.press('Escape');
	await expect(input).toHaveValue('lorem');
	await expect(component.getByRole('listbox')).toHaveCount(0);

	// Second escape clears the input
	await page.keyboard.press('Escape');
	await expect(input).toHaveValue('');
});

test('Should ignore user input if select is disabled', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable disabled options={options} />
		</div>
	);

	await component.getByRole('combobox').click({ force: true });
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect(component.locator('input')).toHaveValue('');
});

test('Should ignore user input if select is readOnly', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable readOnly options={options} />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect(component.locator('input')).toHaveValue('');
});

test('Should omit rendering an input field if not marked as searchable', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.locator('input')).toHaveCount(0);
});

test('Should skip over SelectDivider when using keyboard nav', async ({ mount }) => {
	let triggerCount = 0;

	const component = await mount(
		<div>
			<Select value="foo" options={options}>
				<SelectDivider />
				<SelectOption onTrigger={() => { triggerCount++; }} option={{ label: 'Magic', value: '_magic' }} />
			</Select>
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toBeVisible();

	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	expect(triggerCount).toBe(1);
});

test('Should update options when re-rendering with a different options array', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(options.length);

	const newOptions = [
		{ label: 'Foo', value: 'foo' },
		{ label: 'Bar', value: 'bar' },
		{ label: 'Lorem', value: 'lorem' },
	];

	await component.update(
		<div>
			<Select options={newOptions} />
		</div>
	);
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(newOptions.length);
});

test('Should update options when re-rendering with different children', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options}>
				<SelectOption option={{ label: 'Bonus', value: 'bonus' }} />
			</Select>
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(options.length + 1);
	await expect(component.getByRole('listbox').getByRole('option').nth(options.length)).toHaveText('Bonus');

	await component.update(
		<div>
			<Select options={options}>
				<SelectOption option={{ label: 'Bonus', value: 'bonus' }} />
				<SelectOption option={{ label: 'Extra', value: 'extra' }} />
			</Select>
		</div>
	);
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(options.length + 2);
	await expect(component.getByRole('listbox').getByRole('option').nth(options.length + 1)).toHaveText('Extra');
});

test('Should update filtered options when re-rendering with a different options array', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await page.keyboard.type('foo');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(1);

	const newOptions = [
		{ label: 'Foo', value: 'foo' },
		{ label: 'Foorious', value: 'foorious' },
		{ label: 'Bar', value: 'bar' },
		{ label: 'Lorem', value: 'lorem' },
	];

	await component.update(
		<div>
			<Select searchable options={newOptions} />
		</div>
	);
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(2);
});
