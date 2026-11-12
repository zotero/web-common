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

test('Clicking on the select does not match :focus-visible', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} value="bar" />
		</div>
	);
	const combobox = component.getByRole('combobox');

	await component.locator('.select-value-label').click();
	await expect(combobox).toBeFocused();
	expect(await combobox.evaluate(el => el.matches(':focus-visible'))).toBe(false);
});

test('Double-clicking on the select does not select its label', async ({ mount, page }) => {
	const component = await mount(
		<div>
			<Select options={[{ label: 'Foo bar baz', value: 'foo' }]} value="foo" />
		</div>
	);

	await component.locator('.select-value-label').dblclick();
	expect(await page.evaluate(() => window.getSelection().toString())).toBe('');
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
	await expect.poll(() => changeCount).toBe(1);
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
	await expect.poll(() => focusCount).toBe(1);
	await expect(combobox).toBeFocused();

	await page.keyboard.press('Tab');
	await expect.poll(() => blurCount).toBe(1);
	await expect(button).toBeFocused();

	await page.keyboard.press('Shift+Tab');
	await expect(combobox).toBeFocused();
	await expect.poll(() => focusCount).toBe(2);
	expect(blurCount).toBe(1);

	await page.mouse.click(0, 300);
	await expect.poll(() => blurCount).toBe(2);
	expect(focusCount).toBe(2);
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
	const page = component.page();

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toHaveCount(0);

	await page.keyboard.press('ArrowDown');
	await page.keyboard.type('lo');
	await expect(component.getByRole('listbox')).toHaveCount(0);
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
	await expect.poll(() => triggerCount).toBe(1);
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

test('Should re-apply filter when options change with matching labels', async ({ mount }) => {
	const initialOptions = [
		{ label: 'Apple', value: 'apple' },
		{ label: 'Apricot', value: 'apricot' },
		{ label: 'Banana', value: 'banana' },
	];

	const component = await mount(
		<div>
			<Select searchable options={initialOptions} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await page.keyboard.type('ap');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(2);

	// Update options -- one matching option removed, one new matching option added
	const updatedOptions = [
		{ label: 'Apple', value: 'apple' },
		{ label: 'Banana', value: 'banana' },
		{ label: 'Cape Gooseberry', value: 'cape-gooseberry' },
	];

	await component.update(
		<div>
			<Select searchable options={updatedOptions} />
		</div>
	);
	// "ap" filter re-applied: "Apple" and "Cape Gooseberry" match
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(2);
	await expect(component.getByRole('listbox').getByRole('option').nth(0)).toHaveText('Apple');
	await expect(component.getByRole('listbox').getByRole('option').nth(1)).toHaveText('Cape Gooseberry');
});

test('Renders a value prefix ahead of the value label', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} value="bar" valuePrefix="Fruit:" />
		</div>
	);

	await expect(component.locator('.select-value-prefix')).toHaveText('Fruit:');
	await expect(component.locator('.select-value-prefix + .select-value-label')).toHaveText('Bar');

	// The prefix is not repeated on the options in the menu
	await component.getByRole('combobox').click();
	await expect(component.getByRole('option', { name: 'Bar', exact: true })).toBeVisible();
});

test('Omits the prefix element unless valuePrefix is given', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} value="bar" />
		</div>
	);

	await expect(component.locator('.select-value-label')).toHaveText('Bar');
	await expect(component.locator('.select-value-prefix')).toHaveCount(0);
});

test('Accepts an element as the value prefix', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select
				options={options}
				value="bar"
				valuePrefix={<svg className="icon" role="img" aria-label="Fruit" />}
			/>
		</div>
	);

	await expect(component.locator('.select-value-prefix > svg.icon')).toHaveCount(1);
});

test('Hides the value prefix while filtering a searchable select', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select searchable options={options} value="bar" valuePrefix="Fruit:" />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await expect(component.locator('.select-value-prefix')).toBeVisible();

	await page.keyboard.type('lo');
	await expect(component.locator('.select-value-prefix')).toHaveCount(0);
});

const getOptionId = (component, label) => component.getByRole('option', { name: label, exact: true }).getAttribute('id');

test('Exposes a select-only combobox that controls a sibling listbox', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" options={options} value="bar" />
		</div>
	);
	const combobox = component.getByRole('combobox', { name: 'Fruit' });
	const listboxId = await combobox.getAttribute('aria-controls');

	await expect(combobox).toHaveClass(/select-control/);
	await expect(combobox).toHaveAttribute('aria-expanded', 'false');
	await expect(component.locator(`[id="${listboxId}"]`)).toHaveCount(1);
	await expect(component.locator(`[id="${listboxId}"]`)).toBeHidden();

	await combobox.click();
	await expect(combobox).toHaveAttribute('aria-expanded', 'true');
	await expect(component.getByRole('listbox', { name: 'Fruit' })).toHaveAttribute('id', listboxId);
	await expect(combobox.getByRole('listbox')).toHaveCount(0);
});

test('Points aria-activedescendant at the highlighted option', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" options={options} value="bar" />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.focus();
	await expect(combobox).not.toHaveAttribute('aria-activedescendant');

	await page.keyboard.press('ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Bar'));

	await page.keyboard.press('ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Lorem'));

	await page.keyboard.press('Escape');
	await expect(combobox).not.toHaveAttribute('aria-activedescendant');
});

test('Gives options ids without whitespace', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={[{ label: 'Two words', value: 'two words' }]} />
		</div>
	);

	await component.getByRole('combobox').click();
	expect(await getOptionId(component, 'Two words')).not.toMatch(/\s/);
});

test('A searchable select is an editable combobox showing the selected label', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" searchable options={options} value="bar" />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox', { name: 'Fruit' });

	expect(await combobox.evaluate(el => el.tagName)).toBe('INPUT');
	await expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
	await expect(combobox).toHaveValue('Bar');

	// Focusing selects the label, so typing replaces it
	await combobox.click();
	await expect(combobox).toBeFocused();
	await page.keyboard.type('lo');
	await expect(combobox).toHaveValue('lo');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(1);

	// Escape closes the listbox, a second Escape restores and selects the label
	await page.keyboard.press('Escape');
	await expect(combobox).toHaveValue('lo');
	await page.keyboard.press('Escape');
	await expect(combobox).toHaveValue('Bar');
	await page.keyboard.type('ip');
	await expect(combobox).toHaveValue('ip');
});

test('A label element names a searchable select and its listbox', async ({ mount }) => {
	const component = await mount(
		<div>
			<label htmlFor="fruit-select">Fruit</label>
			<Select id="fruit-select" searchable options={options} />
		</div>
	);
	const combobox = component.getByRole('combobox', { name: 'Fruit' });

	await expect(combobox).toHaveAttribute('id', 'fruit-select');
	await combobox.click();
	await expect(component.getByRole('listbox', { name: 'Fruit' })).toHaveAttribute('aria-label', 'Fruit');
});

test('The listbox of a searchable select references label elements that have an id', async ({ mount }) => {
	const component = await mount(
		<div>
			<label id="fruit-label" htmlFor="fruit-select">Fruit</label>
			<Select id="fruit-select" searchable options={options} />
		</div>
	);

	await component.getByRole('combobox', { name: 'Fruit' }).click();
	const listbox = component.getByRole('listbox', { name: 'Fruit' });
	await expect(listbox).toHaveAttribute('aria-labelledby', 'fruit-label');
	await expect(listbox).not.toHaveAttribute('aria-label');
});

test('The listbox of a searchable select is named after a wrapping label without its options', async ({ mount }) => {
	const component = await mount(
		<div>
			<label id="fruit-label">
				<span>Fruit</span>
				<Select searchable options={options} />
			</label>
		</div>
	);

	await component.getByRole('combobox').click();
	const listbox = component.getByRole('listbox');
	await expect(listbox).toHaveAttribute('aria-label', 'Fruit');
	await expect(listbox).not.toHaveAttribute('aria-labelledby');
});

test('An explicit label names the listbox instead of a label element', async ({ mount }) => {
	const component = await mount(
		<div>
			<label htmlFor="fruit-select">Native</label>
			<Select id="fruit-select" aria-label="Explicit" searchable options={options} />
		</div>
	);

	await component.getByRole('combobox', { name: 'Explicit' }).click();
	await expect(component.getByRole('listbox', { name: 'Explicit' })).toHaveAttribute('aria-label', 'Explicit');
});

test('A label element does not name the listbox of a non-searchable select', async ({ mount }) => {
	const component = await mount(
		<div>
			<label htmlFor="fruit-select">Fruit</label>
			<Select id="fruit-select" options={options} />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).not.toHaveAttribute('aria-label');
	await expect(component.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
});

test('A disabled searchable select disables its input', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Disabled" searchable disabled options={options} />
		</div>
	);

	await expect(component.getByRole('combobox', { name: 'Disabled' })).toBeDisabled();
});

test('A read-only searchable select renders as a focusable non-searchable combobox', async ({ mount }) => {
	const component = await mount(
		<div>
			<button>Before</button>
			<Select aria-label="Read-only" searchable readOnly options={options} value="bar" />
		</div>
	);
	const combobox = component.getByRole('combobox', { name: 'Read-only' });

	await expect(component.locator('input')).toHaveCount(0);
	await expect(component.locator('.select-component')).not.toHaveClass(/is-searchable/);
	await expect(combobox).toHaveAttribute('aria-readonly', 'true');
	await expect(combobox).toHaveText('Bar');

	await component.getByRole('button', { name: 'Before' }).focus();
	await component.page().keyboard.press('Tab');
	await expect(combobox).toBeFocused();
	await expect(combobox).not.toHaveCSS('outline-style', 'none');
});

test('Fires onFocus once when a searchable select receives focus', async ({ mount }) => {
	let focusCount = 0;

	const component = await mount(
		<div>
			<Select searchable options={options} onFocus={() => { focusCount++; }} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await expect(component.getByRole('combobox')).toBeFocused();
	await page.evaluate(() => new Promise(resolve => setTimeout(resolve)));
	expect(focusCount).toBe(1);
});

test('Allows typing a space into the search input', async ({ mount }) => {
	let changeCount = 0;
	const locales = [
		{ label: 'English (US)', value: 'en-US' },
		{ label: 'English (UK)', value: 'en-GB' },
		{ label: 'French', value: 'fr-FR' },
	];

	const component = await mount(
		<div>
			<Select searchable options={locales} value="en-GB" onChange={() => { changeCount++; }} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.click();
	await page.keyboard.type('English (U');
	await expect(combobox).toHaveValue('English (U');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(2);
	expect(changeCount).toBe(0);
});

test('Enter with no matching options closes the listbox without an error', async ({ mount, page }) => {
	const errors = [];
	page.on('pageerror', error => errors.push(error));
	let changeCount = 0;

	const component = await mount(
		<div>
			<Select searchable options={options} onChange={() => { changeCount++; }} />
		</div>
	);

	await component.getByRole('combobox').click();
	await page.keyboard.type('zzz');
	await expect(component.locator('.select-noresults')).toBeVisible();

	await page.keyboard.press('Enter');
	await expect(component.getByRole('listbox')).toHaveCount(0);
	expect(errors).toEqual([]);
	expect(changeCount).toBe(0);
});

test('Announces when no options match, outside the listbox', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" searchable options={options} />
		</div>
	);
	const page = component.page();

	await component.getByRole('combobox').click();
	await expect(component.getByRole('status')).toHaveText('');

	await page.keyboard.type('zzz');
	await expect(component.getByRole('status')).toHaveText('No results found');
	await expect(component.locator('.select-noresults')).toBeVisible();
	await expect(component.getByRole('listbox').locator('.select-noresults')).toHaveCount(0);

	await page.keyboard.press('Backspace');
	await page.keyboard.press('Backspace');
	await page.keyboard.press('Backspace');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(options.length);
	await expect(component.getByRole('status')).toHaveText('');
});

test('Hides dividers from assistive technology', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" options={options}>
				<SelectDivider />
				<SelectOption option={{ label: 'Magic', value: '_magic' }} />
			</Select>
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.locator('.select-divider')).toHaveAttribute('aria-hidden', 'true');
	await expect(component.getByRole('listbox')).toMatchAriaSnapshot(`
		- listbox "Fruit":
		  - option "Foo"
		  - option "Bar"
		  - option "Lorem"
		  - option "Ipsum"
		  - option "Magic"
	`);
});

test('Home, End, PageUp and PageDown move the highlight', async ({ mount }) => {
	const manyOptions = Array.from({ length: 15 }, (_, i) => ({ label: `Option ${i + 1}`, value: `o${i + 1}` }));

	const component = await mount(
		<div>
			<Select options={manyOptions} value="o3" />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.focus();
	await page.keyboard.press('End');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 15'));

	await page.keyboard.press('PageUp');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 5'));

	await page.keyboard.press('PageDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 15'));

	await page.keyboard.press('Home');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 1'));

	await page.keyboard.press('PageDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 11'));

	await page.keyboard.press('Escape');
	await page.keyboard.press('Home');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Option 1'));
});

test('Typing characters highlights matching options', async ({ mount }) => {
	let changeValue = null;
	const fruit = ['Apple', 'Apricot', 'Banana', 'Blue Moon', 'Blue Sky', 'Cherry', 'Chestnut', 'Coconut']
		.map(label => ({ label, value: label.toLowerCase().replace(' ', '-') }));

	const component = await mount(
		<div>
			<Select options={fruit} onChange={v => { changeValue = v; }} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	// A character opens the listbox at the first match, repeating it cycles through matches
	await combobox.focus();
	await page.keyboard.press('b');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Banana'));
	await page.keyboard.press('b');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Blue Moon'));

	// Several characters typed in quick succession are matched together
	await page.waitForTimeout(600);
	await page.keyboard.type('ches');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Chestnut'));

	// A space typed while searching is part of the search rather than selecting
	await page.waitForTimeout(600);
	await page.keyboard.type('blue s');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Blue Sky'));
	await expect(component.getByRole('listbox')).toBeVisible();
	expect(changeValue).toBe(null);

	await page.keyboard.press('Enter');
	await expect.poll(() => changeValue).toBe('blue-sky');
});

test('ArrowUp and Alt+ArrowDown open the listbox, Alt+ArrowUp selects the highlighted option', async ({ mount }) => {
	let changeValue = null;

	const component = await mount(
		<div>
			<Select options={options} value="foo" onChange={v => { changeValue = v; }} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.focus();
	await page.keyboard.press('ArrowUp');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Foo'));

	await page.keyboard.press('Escape');
	await expect(component.getByRole('listbox')).toHaveCount(0);

	await page.keyboard.press('Alt+ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Foo'));

	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Alt+ArrowUp');
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect.poll(() => changeValue).toBe('bar');
});

test('Alt+ArrowUp selects the highlighted option in a searchable select', async ({ mount }) => {
	let changeValue = null;

	const component = await mount(
		<div>
			<Select searchable options={options} value="foo" onChange={v => { changeValue = v; }} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.click();
	await page.keyboard.press('ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Bar'));

	await page.keyboard.press('Alt+ArrowUp');
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect.poll(() => changeValue).toBe('bar');
});

test('A searchable select only sets aria-activedescendant while navigating the options', async ({ mount }) => {
	let changeValue = null;

	const component = await mount(
		<div>
			<Select searchable options={options} onChange={v => { changeValue = v; }} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	// Typing highlights the first match, but focus stays with the text
	await combobox.click();
	await page.keyboard.type('o');
	await expect(component.getByRole('listbox').getByRole('option')).toHaveCount(2);
	await expect(component.locator('.select-option.is-focused')).toHaveText('Foo');
	await expect(combobox).not.toHaveAttribute('aria-activedescendant');

	// Arrow keys move into the options, starting after the highlighted first match
	await page.keyboard.press('ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Lorem'));

	// Caret keys return focus to the text, keep the highlight and move the caret
	for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('ArrowDown');
		await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Lorem'));
		await page.keyboard.press(key);
		await expect(combobox).not.toHaveAttribute('aria-activedescendant');
		await expect(component.locator('.select-option.is-focused')).toHaveText('Lorem');
	}
	await page.keyboard.press('ArrowLeft');
	await expect.poll(() => combobox.evaluate(el => el.selectionStart)).toBe(0);

	// Enter selects the highlighted option
	await page.keyboard.press('Enter');
	await expect.poll(() => changeValue).toBe('lorem');
});

test('Opening a searchable select with ArrowDown exposes the highlighted option, Alt+ArrowDown does not', async ({ mount }) => {
	const component = await mount(
		<div>
			<button>Before</button>
			<Select searchable options={options} value="bar" />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await component.getByRole('button', { name: 'Before' }).focus();
	await page.keyboard.press('Tab');
	await expect(combobox).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Bar'));

	await page.keyboard.press('Escape');
	await page.keyboard.press('Alt+ArrowDown');
	await expect(component.getByRole('listbox')).toBeVisible();
	await expect(combobox).not.toHaveAttribute('aria-activedescendant');
});

test('Typing characters starts a new search once the listbox closes', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select options={options} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.focus();
	for (const closeKey of ['Enter', 'Escape']) {
		await page.keyboard.press('b');
		await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Bar'));
		await page.keyboard.press(closeKey);
		await expect(component.getByRole('listbox')).toHaveCount(0);

		await page.keyboard.press('l');
		await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Lorem'));
		await page.keyboard.press('Escape');
	}
});

test('Alt+ArrowUp does nothing while the listbox is closed', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Select-only" options={options} value="foo" />
			<Select aria-label="Searchable" searchable options={options} value="foo" />
		</div>
	);
	const page = component.page();

	for (const name of ['Select-only', 'Searchable']) {
		const combobox = component.getByRole('combobox', { name });
		await combobox.focus();
		await page.keyboard.press('Alt+ArrowUp');
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
		await expect(component.getByRole('listbox')).toHaveCount(0);
	}
});

test('Switching an open select to read-only closes it and keeps focus on it', async ({ mount }) => {
	let changeCount = 0;
	const onChange = () => { changeCount++; };

	const component = await mount(
		<div>
			<Select aria-label="Fruit" searchable options={options} value="foo" onChange={onChange} />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toBeVisible();

	await component.update(
		<div>
			<Select aria-label="Fruit" searchable readOnly options={options} value="foo" onChange={onChange} />
		</div>
	);
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect(component.getByRole('combobox', { name: 'Fruit' })).toBeFocused();
	expect(changeCount).toBe(0);
});

test('Disabling an open select closes it', async ({ mount }) => {
	const component = await mount(
		<div>
			<Select aria-label="Fruit" options={options} value="foo" />
		</div>
	);

	await component.getByRole('combobox').click();
	await expect(component.getByRole('listbox')).toBeVisible();

	await component.update(
		<div>
			<Select aria-label="Fruit" disabled options={options} value="foo" />
		</div>
	);
	await expect(component.getByRole('listbox')).toHaveCount(0);
	await expect(component.locator('.select-component')).not.toHaveClass(/is-focused/);
});

test('Updating options during a search keeps the active option exposed', async ({ mount }) => {
	const fruit = [
		{ label: 'Apple', value: 'apple' },
		{ label: 'Apricot', value: 'apricot' },
		{ label: 'Banana', value: 'banana' },
	];

	const component = await mount(
		<div>
			<Select searchable options={fruit} />
		</div>
	);
	const page = component.page();
	const combobox = component.getByRole('combobox');

	await combobox.click();
	await page.keyboard.type('ap');
	await page.keyboard.press('ArrowDown');
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Apricot'));

	await component.update(
		<div>
			<Select searchable options={[...fruit, { label: 'Grape', value: 'grape' }]} />
		</div>
	);
	await expect(combobox).toHaveAttribute('aria-activedescendant', await getOptionId(component, 'Apricot'));
});
