import { useCallback, useRef } from 'react';

import { useFocusManager } from '../../hooks';

export const FocusManagerFixture = ({ initialQuerySelector, isCarousel = true, focusByQuery, disableFirst = false }) => {
	const ref = useRef(null);
	const { receiveFocus, receiveBlur, focusNext, focusPrev, focusBySelector } = useFocusManager(ref, {
		initialQuerySelector,
		isCarousel,
	});

	const handleFocus = useCallback((ev) => {
		if (ev.target !== ev.currentTarget) {
			ev.stopPropagation();
			return;
		}
		receiveFocus(ev);
	}, [receiveFocus]);

	const handleKeyDown = (ev) => {
		if (ev.key === 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
		}
	};

	const handleFocusBySelector = () => {
		if (focusByQuery) {
			focusBySelector(focusByQuery);
		}
	};

	return (
		<div>
			<button data-testid="before">Before</button>
			<div
				ref={ref}
				tabIndex={0}
				role="toolbar"
				onFocus={handleFocus}
				onBlur={receiveBlur}
				onKeyDown={handleKeyDown}
				data-testid="toolbar"
			>
				<button tabIndex={-2} data-value="a" disabled={disableFirst}>A</button>
				<button tabIndex={-2} data-value="b">B</button>
				<button tabIndex={-2} data-value="c">C</button>
			</div>
			<button onClick={handleFocusBySelector} data-testid="focus-by">Focus By Selector</button>
			<button data-testid="outside">Outside</button>
		</div>
	);
};
