import { test, expect } from '@playwright/experimental-ct-react';

import { Button } from '../components';

test('Renders an accessible button', async ({ mount }) => {
	const component = await mount(
		<div>
			<Button>FooBar</Button>
		</div>
	);

	const button = component.getByRole('button', { name: 'FooBar' });
	await expect(button).toBeVisible();
	await expect(button).toHaveClass(/btn/);
	await expect(button).not.toHaveClass(/btn-icon/);
});

test('Renders an icon button', async ({ mount }) => {
	const component = await mount(
		<div>
			<Button icon>FooBar</Button>
		</div>
	);

	const button = component.getByRole('button', { name: 'FooBar' });
	await expect(button).toHaveClass(/btn-icon/);
});

test('onClick is called when clicked', async ({ mount }) => {
	let clicked = false;

	const component = await mount(
		<div>
			<Button onClick={() => { clicked = true; }}>FooBar</Button>
		</div>
	);

	const button = component.getByRole('button', { name: 'FooBar' });
	await button.click();
	expect(clicked).toBe(true);
});
