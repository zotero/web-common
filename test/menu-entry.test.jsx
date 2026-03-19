import { test, expect } from '@playwright/experimental-ct-react';

import { MenuEntry } from '../components';

test('Renders a link menu entry', async ({ mount }) => {
	const component = await mount(
		<nav>
			<MenuEntry label="Home" href="/home" />
		</nav>
	);

	const link = component.getByRole('link', { name: 'Home' });
	await expect(link).toBeVisible();
	await expect(link).toHaveClass(/nav-link/);
	await expect(link).toHaveAttribute('href', '/home');
});

test('Renders a dropdown menu entry', async ({ mount }) => {
	const entries = [
		{ href: '/one', label: 'One' },
		{ href: '/two', label: 'Two' },
	];

	const component = await mount(
		<nav>
			<MenuEntry label="More" dropdown entries={ entries } />
		</nav>
	);

	const toggle = component.locator('.dropdown-toggle');
	await expect(toggle).toBeVisible();
	await expect(toggle).toHaveText(/More/);
});

test('Renders with active class on dropdown', async ({ mount }) => {
	const entries = [{ href: '/one', label: 'One' }];

	const component = await mount(
		<nav>
			<MenuEntry label="Active" dropdown entries={ entries } active />
		</nav>
	);

	const navItem = component.locator('.nav-item');
	await expect(navItem).toHaveClass(/active/);
});

test('Renders with truncate', async ({ mount }) => {
	const component = await mount(
		<nav>
			<MenuEntry label="Long Label" href="/long" truncate />
		</nav>
	);

	const truncated = component.locator('.truncate');
	await expect(truncated).toBeVisible();
	await expect(truncated).toHaveText('Long Label');
});
