import { Fragment, useCallback, memo } from 'react';

import { focusableSelector } from '../utils/dom';

const FocusTrap = ({ children, disabled = false }) => {
	const handleFocus = useCallback((ev) => {
		const siblingsExclude = [...ev.currentTarget.parentElement.querySelectorAll('[data-focus-trap-after] ~ *')];
		const siblingsInclude = [...ev.currentTarget.parentElement.querySelectorAll('[data-focus-trap-before] ~ *:not([data-focus-trap-after])')];
		const siblings = siblingsInclude.filter(candidate => !siblingsExclude.includes(candidate));
		const candidates = [];

		siblings.forEach(s => {
			if(s.matches(focusableSelector)) {
				candidates.push(s);
			}
			candidates.push(...s.querySelectorAll(focusableSelector));
		});

		if(!candidates.length) {
			if (process.env.NODE_ENV === 'development') {
				console.error("<FocusTrap> used with no focusable elements inside the trap.");
			}
			return;
		}

		candidates[(ev.currentTarget.dataset.focusTrapBefore ? (candidates.length - 1) : 0)]
			.focus({ preventScroll: true });

	}, []);

	// Prevent a parent focus manager (e.g. react-modal's scopeTab) from intercepting Tab key events
	// when the focused element has a negative tabIndex. Such managers build their tabbable list from
	// elements with tabIndex >= 0; when the focused element has tabIndex=-2 (used by useFocusManager),
	// they can't find it and jump to the wrong target. By stopping propagation only for negative-tabIndex
	// elements, we let the browser handle Tab natively while preserving wrap-around for normal elements.
	const handleKeyDown = useCallback((ev) => {
		if(ev.key === 'Tab' && document.activeElement?.tabIndex < 0) {
			ev.stopPropagation();
		}
	}, []);

	return (
		<Fragment>
			{ !disabled && <div tabIndex={ 0 } data-focus-trap-before onFocus={ handleFocus } style={ { position: 'absolute', opacity: 0 } } /> }
			{ disabled ? children : <div onKeyDown={ handleKeyDown } style={ { display: 'contents' } }>{ children }</div> }
			{ !disabled && <div tabIndex={ 0 } data-focus-trap-after onFocus={ handleFocus } style={ { position: 'absolute', opacity: 0 } } /> }
		</Fragment>
	);
}

const FocusTrapMemo = memo(FocusTrap);
FocusTrapMemo.displayName = 'FocusTrap';

export { FocusTrapMemo as FocusTrap };
