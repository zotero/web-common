import { test, expect } from '@playwright/experimental-ct-react';

import { ZoteroShimFixture } from './fixtures/zotero-shim-fixture';

test('configures the shim and exposes Zotero on window', async ({ mount }) => {
	const component = await mount(<ZoteroShimFixture locale="en-US" />);
	const result = component.getByTestId('result');

	await expect(result).toHaveAttribute('data-window-zotero', 'true');
	await expect(result).toHaveAttribute('data-locale', 'en-US');
	await expect(result).toHaveAttribute('data-has-utilities-item', 'true');
});

test('getString maps known date identifiers and passes others through', async ({ mount }) => {
	const component = await mount(<ZoteroShimFixture locale="en-US" />);
	const result = component.getByTestId('result');

	// The default formatMessage stub returns the defaultMessage for known ids
	await expect(result).toHaveAttribute('data-today', 'today');
	await expect(result).toHaveAttribute('data-yesterday', 'yesterday');
	await expect(result).toHaveAttribute('data-tomorrow', 'tomorrow');
	// Unmapped identifiers are returned unchanged
	await expect(result).toHaveAttribute('data-passthrough', 'some.unmapped.identifier');
});

test('getString resolves known identifiers through the provided intl messages', async ({ mount }) => {
	const component = await mount(
		<ZoteroShimFixture
			locale="en-US"
			messages={{ 'date.today': 'custom-today', 'date.tomorrow': 'custom-tomorrow' }}
		/>
	);
	const result = component.getByTestId('result');

	await expect(result).toHaveAttribute('data-today', 'custom-today');
	await expect(result).toHaveAttribute('data-tomorrow', 'custom-tomorrow');
	// Not overridden, so it falls back to the default message
	await expect(result).toHaveAttribute('data-yesterday', 'yesterday');
});

test('localeCompare sorts numerically and is case/accent insensitive', async ({ mount }) => {
	const component = await mount(<ZoteroShimFixture locale="en-US" />);
	const result = component.getByTestId('result');

	await expect(result).toHaveAttribute('data-sorted', JSON.stringify(['item1', 'item2', 'item10']));
	await expect(result).toHaveAttribute('data-cmp-numeric', '-1'); // item2 < item10 (numeric)
	await expect(result).toHaveAttribute('data-cmp-case', '0');     // a == A (base sensitivity)
	await expect(result).toHaveAttribute('data-cmp-accent', '0');   // a == á (base sensitivity)
});

test('getZotero throws before the shim is configured', async ({ mount }) => {
	const component = await mount(<ZoteroShimFixture probeUnconfigured />);

	await expect(component.getByTestId('unconfigured-error'))
		.toContainText('Zotero shim is not configured');
});

// An invalid locale (even after normalization) must fall back to en-US.
test('falls back gracefully when given an invalid locale', async ({ mount }) => {
	const component = await mount(<ZoteroShimFixture locale="c.utf8" />);
	const result = component.getByTestId('result');

	await expect(component.getByTestId('error')).toHaveCount(0);
	// localeCompare must remain functional via the fallback locale
	await expect(result).toHaveAttribute('data-sorted', JSON.stringify(['item1', 'item2', 'item10']));
});

test('normalizes a POSIX-style locale (sv_SE) to a real sv-SE collator', async ({ mount }) => {
	const items = ['apple', 'äpple', 'banana'];

	// en-US treats ä as a (base sensitivity), so the input order is preserved
	const enUS = await mount(<ZoteroShimFixture locale="en-US" sortInput={items} />);
	await expect(enUS.getByTestId('result')).toHaveAttribute('data-sorted', JSON.stringify(['apple', 'äpple', 'banana']));
	await enUS.unmount();

	// sv-SE (normalized from sv_SE) sorts ä after z, so äpple goes last
	const svSE = await mount(<ZoteroShimFixture locale="sv_SE" sortInput={items} />);
	await expect(svSE.getByTestId('result')).toHaveAttribute('data-sorted', JSON.stringify(['apple', 'banana', 'äpple']));
});
