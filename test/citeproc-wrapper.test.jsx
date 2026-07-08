import { test, expect } from '@playwright/experimental-ct-react';

import { CiteprocWrapperFixture } from './fixtures/citeproc-wrapper-fixture';
import acmSigProceedingsStyle from './fixtures/acm-sig-proceedings.xml';

// Mock bibliography output where entry_ids has an item but items array is empty.
// This simulates the citeproc-js behavior described in zotero/zoterobib#309 where
// items with no meaningful fields produce entry_ids but no corresponding items.
const mockMismatchedBibliography = [
	{
		entry_ids: [['AABBCCDD']],
		bibliography_errors: [],
		bibstart: '',
		bibend: '',
	},
	[] // empty items array -- length mismatch with entry_ids
];

test('skipErrorChecking: true -- mismatched entry_ids/items produces empty bibliography', async ({ mount }) => {
	const component = await mount(
		<CiteprocWrapperFixture
			skipErrorChecking={true}
			items={[{ id: 'AABBCCDD', type: 'book' }]}
			mockBibliography={mockMismatchedBibliography}
		/>
	);

	await expect(component.getByTestId('result')).toHaveAttribute('data-count', '0');
});

test('skipErrorChecking: false (default) -- mismatched entry_ids/items throws', async ({ mount }) => {
	const component = await mount(
		<CiteprocWrapperFixture
			skipErrorChecking={false}
			items={[{ id: 'AABBCCDD', type: 'book' }]}
			mockBibliography={mockMismatchedBibliography}
		/>
	);

	await expect(component.getByTestId('error')).toContainText(
		'entry_ids length does not match items length'
	);
});

test('makeBibliography produces entries for 2 items', async ({ mount }) => {
	const items = [
		{
			id: 'item1',
			type: 'book',
			title: 'The Great Gatsby',
			author: [{ family: 'Fitzgerald', given: 'F. Scott' }],
			issued: { 'date-parts': [[1925]] },
			publisher: 'Scribner',
		},
		{
			id: 'item2',
			type: 'book',
			title: 'To Kill a Mockingbird',
			author: [{ family: 'Lee', given: 'Harper' }],
			issued: { 'date-parts': [[1960]] },
			publisher: 'J. B. Lippincott & Co.',
		},
	];

	const component = await mount(
		<CiteprocWrapperFixture items={items} />
	);

	const result = component.getByTestId('result');
	await expect(result).toHaveAttribute('data-count', '2');
	await expect(result).toContainText('Fitzgerald');
	await expect(result).toContainText('The Great Gatsby');
	await expect(result).toContainText('Lee');
	await expect(result).toContainText('To Kill a Mockingbird');
});

test('numeric style (ACM SIG Proceedings) -- number-only entry does not crash', async ({ mount }) => {
	const component = await mount(
		<CiteprocWrapperFixture
			style={acmSigProceedingsStyle}
			skipErrorChecking={false}
			items={[{ id: 'a', type: 'webpage', author: [{ family: 'Doe', given: 'Jane' }] }]}
		/>
	);

	const result = component.getByTestId('result');
	await expect(result).toHaveAttribute('data-count', '1');
	await expect(result).toContainText('csl-error');
});
