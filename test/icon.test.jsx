import { test, expect } from '@playwright/experimental-ct-react';

import { Icon } from '../components';

test('Hides an unlabelled icon from assistive technology', async ({ mount }) => {
	const component = await mount(
		<div>
			<Icon type="16/chevron-9" width="16" height="16" />
		</div>
	);

	const svg = component.locator('svg');
	await expect(svg).toHaveAttribute('aria-hidden', 'true');
	await expect(svg).not.toHaveAttribute('role');
	await expect(component.getByRole('img')).toHaveCount(0);
});

test('Exposes an icon with a label as a named image', async ({ mount }) => {
	const component = await mount(
		<div>
			<Icon type="zotero-logo" width="96" height="26" label="Zotero" />
		</div>
	);

	await expect(component).toMatchAriaSnapshot(`
		- img "Zotero"
	`);
	await expect(component.locator('svg')).not.toHaveAttribute('aria-hidden');
});

test('Exposes an icon with aria-label as a named image', async ({ mount }) => {
	const component = await mount(
		<div>
			<Icon type="16/tick" width="16" height="16" aria-label="Completed" />
		</div>
	);

	await expect(component).toMatchAriaSnapshot(`
		- img "Completed"
	`);
});

test('Exposes an icon with aria-labelledby as an image named by the referenced element', async ({ mount }) => {
	const component = await mount(
		<div>
			<span id="icon-label">Completed</span>
			<Icon type="16/tick" width="16" height="16" aria-labelledby="icon-label" />
		</div>
	);

	const svg = component.locator('svg');
	await expect(svg).toHaveAttribute('aria-labelledby', 'icon-label');
	await expect(svg).not.toHaveAttribute('aria-label');
	await expect(component.getByRole('img', { name: 'Completed' })).toHaveCount(1);
});

test('Prefers label over aria-label', async ({ mount }) => {
	const component = await mount(
		<div>
			<Icon type="16/tick" width="16" height="16" label="Completed" aria-label="Done" />
		</div>
	);

	await expect(component.locator('svg')).toHaveAttribute('aria-label', 'Completed');
});

test('Uses the role provided by the consumer', async ({ mount }) => {
	const component = await mount(
		<div>
			<Icon type="16/tick" width="16" height="16" label="Completed" role="status" />
			<Icon type="16/chevron-9" width="16" height="16" role="presentation" />
		</div>
	);

	await expect(component.getByRole('status', { name: 'Completed' })).toHaveCount(1);
	await expect(component.locator('svg[role="presentation"]')).toHaveAttribute('aria-hidden', 'true');
});
