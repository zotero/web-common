import { useCallback, useLayoutEffect, useRef } from 'react';

import { useFocusManager } from '../../hooks';

export const FocusManagerFixture = ({ initialQuerySelector, isCarousel = true, focusByQuery, disableFirst = false, }) => {
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

export const FocusManagerItemsFixture = ({ autoFocusControl = null, layoutFocusControl = null }) => {
	const ref = useRef(null);
	const { receiveFocus, receiveBlur, receiveMouseDown, focusNext, focusPrev } = useFocusManager(ref, {
		isCarousel: false,
		itemSelector: '.item',
	});

	useLayoutEffect(() => {
		if (layoutFocusControl !== null) {
			ref.current.querySelector(`[data-control="${layoutFocusControl}"]`).focus();
		}
	}, [layoutFocusControl]);

	const handleKeyDown = (ev) => {
		if (ev.key === 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
		}
	};

	return (
		<div>
			<button data-testid="before">Before</button>
			<div
				ref={ref}
				tabIndex={0}
				onFocus={receiveFocus}
				onBlur={receiveBlur}
				onMouseDown={receiveMouseDown}
				onKeyDown={handleKeyDown}
				data-testid="list"
			>
				{['a', 'b', 'c'].map(value => (
					<div className="item" key={value}>
						<a href={`#${value}`} tabIndex={-2} data-value={value}>Item {value.toUpperCase()}</a>
						<p>Description of {value.toUpperCase()}</p>
						<button data-control={value} autoFocus={value === autoFocusControl}>Add {value.toUpperCase()}</button>
					</div>
				))}
			</div>
			<button data-testid="outside">Outside</button>
		</div>
	);
};
