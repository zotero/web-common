import { test, expect } from '@playwright/experimental-ct-react';

import { ProgressRing } from '../components';

const CIRCUMFERENCE_R7 = 2 * Math.PI * 7;

test('Renders an accessible progressbar with default geometry', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing />
		</div>
	);

	const ring = component.getByRole('progressbar');
	await expect(ring).toBeVisible();
	await expect(ring).toHaveAttribute('aria-valuenow', '0');
	await expect(ring).toHaveAttribute('aria-valuemin', '0');
	await expect(ring).toHaveAttribute('aria-valuemax', '1');
	await expect(ring).toHaveAttribute('width', '16');
	await expect(ring).toHaveAttribute('height', '16');
	await expect(ring).toHaveAttribute('viewBox', '0 0 16 16');
});

test('Reflects value and max in aria attributes', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing value={ 3 } max={ 10 } />
		</div>
	);

	const ring = component.getByRole('progressbar');
	await expect(ring).toHaveAttribute('aria-valuenow', '3');
	await expect(ring).toHaveAttribute('aria-valuemax', '10');
});

test('Indicator offset corresponds to the fraction', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing value={ 0.5 } />
		</div>
	);

	const fill = component.locator('.progress-ring-fill');
	const offset = parseFloat(await fill.getAttribute('stroke-dashoffset'));
	expect(offset).toBeCloseTo(CIRCUMFERENCE_R7 * 0.5, 1);
});

test('Clamps a value above max to a full ring', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing value={ 2 } max={ 1 } />
		</div>
	);

	const fill = component.locator('.progress-ring-fill');
	const offset = parseFloat(await fill.getAttribute('stroke-dashoffset'));
	expect(offset).toBeCloseTo(0, 5);
});

test('Clamps a negative value to an empty ring', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing value={ -1 } />
		</div>
	);

	const fill = component.locator('.progress-ring-fill');
	const offset = parseFloat(await fill.getAttribute('stroke-dashoffset'));
	expect(offset).toBeCloseTo(CIRCUMFERENCE_R7, 1);
});

test('Radius and strokeWidth drive the geometry', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing radius={ 20 } strokeWidth={ 4 } />
		</div>
	);

	const ring = component.getByRole('progressbar');
	await expect(ring).toHaveAttribute('width', '44');
	await expect(ring).toHaveAttribute('viewBox', '0 0 44 44');

	const fill = component.locator('.progress-ring-fill');
	await expect(fill).toHaveAttribute('r', '20');
	await expect(fill).toHaveAttribute('transform', 'rotate(-90 22 22)');
});

test('Passes through data attributes', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing data-foo="bar" />
		</div>
	);

	await expect(component.getByRole('progressbar')).toHaveAttribute('data-foo', 'bar');
});

test('Applies themed strokes and the lerp transition', async ({ mount }) => {
	const component = await mount(
		<div>
			<ProgressRing value={ 0.5 } />
		</div>
	);

	const track = component.locator('.progress-ring-track');
	const fill = component.locator('.progress-ring-fill');

	await expect(track).toHaveCSS('stroke', 'rgb(221, 221, 221)');
	await expect(fill).toHaveCSS('stroke', 'rgb(41, 112, 255)');
	await expect(track).toHaveCSS('fill', 'none');
	await expect(fill).toHaveCSS('stroke-linecap', 'round');
	await expect(fill).toHaveCSS('transition-property', 'stroke-dashoffset');
	await expect(fill).toHaveCSS('transition-duration', '0.15s');
});
