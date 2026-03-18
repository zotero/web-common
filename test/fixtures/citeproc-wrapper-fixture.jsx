import { useEffect, useState } from 'react';
import CSL from 'citeproc';

import { CiteprocWrapper } from '../../cite/citeproc-wrapper';
import mlaStyle from './mla.xml';
import localeEnUS from './locales-en-us.xml';

window.CSL = CSL;

// Pre-seed locale cache so citeproc-js doesn't need sync XHR
// (sync XHR interception via page.route() is unreliable in WebKit)
CiteprocWrapper.setLocaleCache('en-US', localeEnUS);

export const CiteprocWrapperFixture = ({ style = mlaStyle, skipErrorChecking = false, items = [], mockBibliography = null, }) => {
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				const wrapper = await CiteprocWrapper.new(style, {
					DriverORCSL: CSL,
					skipErrorChecking,
					useCiteprocJS: true,
					format: 'html',
					localesPath: '/locales/',
				});
				wrapper.insertReferences(items);
				if (mockBibliography) {
					wrapper.driver.makeBibliography = () => mockBibliography;
				}
				const bib = wrapper.makeBibliography();
				setResult(bib);
			} catch (e) {
				setError(e.message);
			}
		})();
	}, [items, mockBibliography, skipErrorChecking, style]);

	return (
		<div>
			{error !== null && <div data-testid="error">{error}</div>}
			{result !== null && <div data-testid="result" data-count={result.length}>{JSON.stringify(result)}</div>}
			{error === null && result === null && <div data-testid="loading">Loading...</div>}
		</div>
	);
};
