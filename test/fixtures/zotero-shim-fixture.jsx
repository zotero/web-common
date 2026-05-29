import { useEffect, useState } from 'react';

import { configureZoteroShim, getZotero } from '../../zotero';
import schema from '../../modules/zotero-utilities/resource/schema/global/schema.json';

// Stable default references so they don't change identity between renders and
// retrigger the effect (which would loop via setState).
const DEFAULT_MESSAGES = {};
const DEFAULT_SORT_INPUT = ['item10', 'item2', 'item1'];

// configureZoteroShim is not a component -- it is a factory that touches
// `window` and returns a Zotero shim object. This thin fixture runs it in the
// browser (where `window` exists) and projects its serializable outputs onto
// the DOM so the Playwright test, which runs in Node, can assert on them.
// Mirrors the approach used by citeproc-wrapper-fixture.jsx.
//
// Only serializable primitives cross the Node/browser boundary as props; the
// `intl` object (which carries a function) is constructed here instead.
export const ZoteroShimFixture = ({
	locale = 'en-US',
	messages = DEFAULT_MESSAGES,
	sortInput = DEFAULT_SORT_INPUT,
	probeUnconfigured = false,
}) => {
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const [unconfiguredError, setUnconfiguredError] = useState(null);

	useEffect(() => {
		// Verify getZotero() throws before the shim has been configured.
		if (probeUnconfigured) {
			try {
				getZotero();
				setUnconfiguredError('getZotero did not throw');
			} catch (e) {
				setUnconfiguredError(e.message);
			}
			return;
		}

		// The shim's intl dependency only needs `locale` and `formatMessage`.
		// The test customises behaviour via the `locale` and `messages` props.
		const intl = {
			locale,
			formatMessage: ({ id, defaultMessage }) => (id in messages ? messages[id] : defaultMessage),
		};

		try {
			const Zotero = configureZoteroShim(schema, intl);
			setResult({
				locale: Zotero.locale,
				windowZoteroSet: window.Zotero === Zotero,
				hasUtilitiesItem: typeof Zotero.Utilities.Item !== 'undefined',
				today: Zotero.getString('date.today'),
				yesterday: Zotero.getString('date.yesterday'),
				tomorrow: Zotero.getString('date.tomorrow'),
				passthrough: Zotero.getString('some.unmapped.identifier'),
				sorted: [...sortInput].sort(Zotero.localeCompare),
				cmpCase: Math.sign(Zotero.localeCompare('a', 'A')),
				cmpAccent: Math.sign(Zotero.localeCompare('a', 'á')),
				cmpNumeric: Math.sign(Zotero.localeCompare('item2', 'item10')),
			});
		} catch (e) {
			setError(e.message);
		}
	}, [locale, messages, sortInput, probeUnconfigured]);

	// The testid nodes must be descendants of the component root: mount()
	// returns a locator for the root element and getByTestId only matches
	// descendants, so everything is wrapped in an outer <div>.
	return (
		<div>
			{unconfiguredError !== null && (
				<div data-testid="unconfigured-error">{unconfiguredError}</div>
			)}
			{error !== null && <div data-testid="error">{error}</div>}
			{result !== null && (
				<div
					data-testid="result"
					data-locale={result.locale}
					data-window-zotero={String(result.windowZoteroSet)}
					data-has-utilities-item={String(result.hasUtilitiesItem)}
					data-today={result.today}
					data-yesterday={result.yesterday}
					data-tomorrow={result.tomorrow}
					data-passthrough={result.passthrough}
					data-sorted={JSON.stringify(result.sorted)}
					data-cmp-case={String(result.cmpCase)}
					data-cmp-accent={String(result.cmpAccent)}
					data-cmp-numeric={String(result.cmpNumeric)}
				/>
			)}
			{unconfiguredError === null && error === null && result === null && (
				<div data-testid="loading">Loading...</div>
			)}
		</div>
	);
};
