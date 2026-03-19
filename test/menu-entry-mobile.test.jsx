import { test, expect } from '@playwright/experimental-ct-react';

import { MobileMenuEntry } from '../components';

test('Renders a mobile menu entry', async ({ mount }) => {
	const component = await mount(
		<nav>
			<MobileMenuEntry label="Home" href="/home" />
		</nav>
	);

	const link = component.getByRole('link', { name: 'Home' });
	await expect(link).toBeVisible();
	await expect(link).toHaveClass(/nav-link/);
	await expect(link).toHaveAttribute('href', '/home');
});

test('Renders with nav-item wrapper', async ({ mount }) => {
	const component = await mount(
		<nav>
			<MobileMenuEntry label="About" href="/about" />
		</nav>
	);

	const navItem = component.locator('.nav-item');
	await expect(navItem).toBeVisible();
});

test('Renders with custom className', async ({ mount }) => {
	const component = await mount(
		<nav>
			<MobileMenuEntry label="Custom" href="/custom" className="my-class" />
		</nav>
	);

	const link = component.getByRole('link', { name: 'Custom' });
	await expect(link).toHaveClass(/my-class/);
	await expect(link).toHaveClass(/nav-link/);
});
