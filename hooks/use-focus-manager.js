import {useCallback, useMemo, useRef} from 'react';

const isModifierKey = ev => ev.getModifierState("Meta") || ev.getModifierState("Alt") ||
		ev.getModifierState("Control") || ev.getModifierState("OS");


/**
 * React hook to manage focus within a component. Useful for managing focus within lists, toolbars, etc.
 * Both receiveFocus and receiveBlur must be installed on the container element. When the container element receives
 * focus, it will move focus to the first viable candidate, identified either by the tabIndex value or by the
 * initialQuerySelector, except if isFocusable is set to true. In that case, the container itself will be focused and
 * the first call to focusNext will move focus to the first viable candidate.
 * FocusManager remembers the last focused element within the container and will move focus to that element when focus
 * is received again.
 * Candidates can be grouped into items by setting itemSelector. Each item holds one candidate and possibly other
 * focusable controls that are not candidates (e.g. buttons). A control that receives focus keeps it, and its item's
 * candidate is remembered. While the control has focus, the item's candidate is a tab stop, so that Shift+Tab returns
 * to it, and focusNext and focusPrev move from the item's candidate.
 * If receiveMouseDown is also installed on the container, a press on a part of the container that can't take focus
 * (e.g. text) leaves focus on the container itself, rather than moving it to a candidate.
 *
 * @param {Object} ref - React ref object pointing to the focusable container.
 * @param {Object} [options] - Configuration options.
 * @param {string|null} [options.initialQuerySelector=null] - Initial query selector to focus on.
 * @param {boolean} [options.isCarousel=true] - Whether the focus should loop around. If isFocusable is true, carousel
 *                                              works forward only.
 * @param {number} [options.targetTabIndex=-2] - The tabIndex value to target for focusable elements.
 * @param {boolean} [options.isFocusable=false] - Whether the container itself is focusable.
 * @param {string|null} [options.itemSelector=null] - Selector for items grouping a candidate with other controls.
 *
 * @returns {Object} - An object containing focus management functions.
 * @returns {Function} return.receiveFocus - Function to handle focus event.
 * @returns {Function} return.receiveBlur - Function to handle blur event.
 * @returns {Function} return.receiveMouseDown - Optional function to handle mousedown event.
 * @returns {Function} return.focusNext - Function to focus the next element.
 * @returns {Function} return.focusPrev - Function to focus the previous element.
 * @returns {Function} return.focusBySelector - Function to focus an element by selector or element.
 * @returns {Function} return.resetLastFocused - Function to reset the stored reference to the last focused element.
 * @returns {Function} return.registerAutoFocus - Function to register an element for autofocus.
 * @returns {Function} return.focusOnLast - Function to focus on the last-focused element. Both the node and the index
 *                                          within candidates are stored. If the node is not found, the index is used to
 *                                          find the node.
 */
const useFocusManager = (ref, { initialQuerySelector = null, isCarousel = true, targetTabIndex = -2, isFocusable = false, itemSelector = null } = {}) => {
	const isFocused = useRef(false);
	const isPressed = useRef(false);
	const lastFocused = useRef(null);
	const lastFocusedIndex = useRef(null);
	const originalTabIndex = useRef(null);
	const tabStop = useRef(null);

	const getTabbables = useCallback(() => {
		// a candidate made a tab stop by setTabStop is still a candidate
		return Array.from(
			ref.current.querySelectorAll(
				`[tabIndex="${targetTabIndex}"]:not([disabled]):not(.offscreen), [data-focus-tab-stop]:not([disabled]):not(.offscreen)`
			)
		).filter(t => t.offsetParent);
	}, [ref, targetTabIndex]);

	const getItemCandidate = useCallback(element => {
		if(itemSelector === null || ref.current === null || !(element instanceof Element)) {
			return null;
		}

		const item = element.closest(itemSelector);
		if(item === null || !ref.current.contains(item)) {
			return null;
		}

		const tabbables = getTabbables();
		if(tabbables.includes(element)) {
			return null;
		}
		return tabbables.find(t => item.contains(t)) ?? null;
	}, [getTabbables, itemSelector, ref]);

	const setTabStop = useCallback(element => {
		if(tabStop.current === element) {
			return;
		}

		if(tabStop.current !== null) {
			delete tabStop.current.dataset.focusTabStop;
			tabStop.current.tabIndex = targetTabIndex;
		}

		tabStop.current = element;
		if(element !== null) {
			element.dataset.focusTabStop = '';
			element.tabIndex = 0;
		}
	}, [targetTabIndex]);

	const storeLastFocused = useCallback((element) => {
		lastFocused.current = element;

		if (!(element instanceof Element)) {
			lastFocusedIndex.current = null;
			return;
		}

		if(ref.current === null) {
			return;
		}

		const tabbables = getTabbables();
		const index = tabbables.indexOf(element);
		lastFocusedIndex.current = index >= 0 ? index : null;
	}, [getTabbables, ref]);

	const focusNext = useCallback((ev, { useCurrentTarget = true, targetEnd = null, offset = 1 } = {}) => {
		const tabbables = getTabbables();
		if(tabbables.length === 0) {
			return;
		}
		const target = useCurrentTarget ? ev.currentTarget : ev.target;
		const current = getItemCandidate(target) ?? target;
		const nextIndex = tabbables.findIndex(t => t === current) + offset;

		if(isModifierKey(ev)) {
			// ignore key navigation with modifier keys. See #252
			return;
		}
		ev.preventDefault();
		if(nextIndex < tabbables.length) {
			tabbables[nextIndex].focus();
			storeLastFocused(tabbables[nextIndex]);
		} else if (targetEnd !== null) {
			targetEnd.focus();
			storeLastFocused(null);
		} else if(isCarousel) {
			tabbables[0].focus();
			storeLastFocused(tabbables[0]);
		} else {
			tabbables[tabbables.length - 1].focus();
			storeLastFocused(tabbables[tabbables.length - 1]);
		}
		return lastFocused.current;
	}, [getItemCandidate, getTabbables, isCarousel, storeLastFocused]);

	const focusPrev = useCallback((ev, { useCurrentTarget = true, targetEnd = null, offset = 1 } = {}) => {
		const tabbables = getTabbables();
		if(tabbables.length === 0) {
			return;
		}
		const target = useCurrentTarget ? ev.currentTarget : ev.target;
		const current = getItemCandidate(target) ?? target;
		const prevIndex = tabbables.findIndex(t => t === current) - offset;
		if(isModifierKey(ev)) {
			// ignore key navigation with modifier keys. See #252
			return;
		}
		ev.preventDefault();
		if(prevIndex >= 0) {
			tabbables[prevIndex].focus();
			storeLastFocused(tabbables[prevIndex]);
		} else if (targetEnd !== null) {
			targetEnd.focus();
			storeLastFocused(null);
		} else if(isFocusable) {
			ref.current.focus();
			storeLastFocused(null);
		}else if(isCarousel) {
			tabbables[tabbables.length - 1].focus();
			storeLastFocused(tabbables[tabbables.length - 1]);
		} else {
			tabbables[0].focus();
			storeLastFocused(tabbables[0]);
		}
		return lastFocused.current;
	}, [getItemCandidate, getTabbables, isFocusable, isCarousel, storeLastFocused, ref]);

	const focusBySelector = useCallback(selectorOrEl => {
		const nextEl = typeof(selectorOrEl) === 'string' ?
			ref.current.querySelector(selectorOrEl) :
			selectorOrEl;

		if(nextEl) {
			storeLastFocused(nextEl);
			nextEl.focus();
		}
	}, [ref, storeLastFocused]);

	const focusOnLast = useCallback(() => {
		if(lastFocused.current) {
			if(document.body.contains(lastFocused.current)) {
				lastFocused.current.focus();
			} else if(lastFocusedIndex.current !== null) {
				const tabbables = getTabbables();
				if (tabbables[lastFocusedIndex.current]) {
					tabbables[lastFocusedIndex.current].focus();
					storeLastFocused(tabbables[lastFocusedIndex.current]);
				}
			}
		}
	}, [getTabbables, storeLastFocused]);

	const resetLastFocused = useCallback(() => {
		storeLastFocused(null);
	}, [storeLastFocused]);

	const markFocused = useCallback(() => {
		if(!ref.current.dataset.focusRoot) {
			// we have not yet focused on this item, store original tabIndex and mark as focus root
			ref.current.dataset.focusRoot = '';
			originalTabIndex.current = originalTabIndex.current === null ? ref.current.tabIndex : originalTabIndex.current;
		}

		isFocused.current = true;
		if(ref.current.tabIndex >= 0) {
			ref.current.tabIndex = -1;
		}
	}, [ref]);

	const receiveFocus = useCallback((ev, { preventScroll = false, isBounced = false } = {}) => {
		ev.stopPropagation();

		if(ref.current === null && !isBounced) {
			ev.persist();
			setTimeout(() => receiveFocus(ev, { isBounced: true }));
			return;
		}

		if(ref.current === null && isBounced) {
			return;
		}

		if(isBounced && document.activeElement !== ev.target) {
			// focus has moved on while this call was deferred, don't steal the focus. If it moved within the
			// container, the focus event for its new target is handled on its own.
			return;
		}

		const wasPressed = isPressed.current;
		isPressed.current = false;

		const itemCandidate = getItemCandidate(ev.target);
		setTabStop(itemCandidate);

		if(itemCandidate !== null) {
			// focus landed on a control within an item (e.g. it was clicked), keep it there and remember the item
			storeLastFocused(itemCandidate);
			markFocused();
			return true;
		}

		if(isFocused.current) {
			return false;
		}

		markFocused();

		if (isFocusable) {
			return;
		}

		if(ev.target !== ev.currentTarget && getTabbables().includes(ev.target)) {
			// focus landed directly on a candidate (e.g. it was clicked), keep it there
			storeLastFocused(ev.target);
			return true;
		}

		if(ev.target === ev.currentTarget && wasPressed) {
			// the container itself was pressed (e.g. on its text), keep the focus where the user clicked
			return false;
		}

		if(lastFocused.current === null && initialQuerySelector !== null) {
			if(typeof(initialQuerySelector) === 'object' && initialQuerySelector.current && 'focus' in initialQuerySelector.current) {
				// passed as a ref
				storeLastFocused(initialQuerySelector.current);
			} else if (Array.isArray(initialQuerySelector) || typeof(initialQuerySelector) === 'string') {
				//passed as a string or array of strings
				if(!Array.isArray(initialQuerySelector)) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					initialQuerySelector = [initialQuerySelector];
				}
				const tabbables = getTabbables();
				for (let i = 0; i < initialQuerySelector.length; i++) {
					const nextSelector = initialQuerySelector[i];
					const allMatches = ref.current.querySelectorAll(nextSelector);
					for (const candidate of allMatches) {
						if (tabbables.includes(candidate)) {
							storeLastFocused(candidate);
							break;
						}
					}
					if(lastFocused.current) {
						break;
					}
				}
			}

			if(lastFocused.current) {
				lastFocused.current.focus({ preventScroll });
				return true;
			}
		}

		const candidates = getTabbables();
		if(lastFocused.current !== null && candidates.includes(lastFocused.current)) {
			lastFocused.current.focus({ preventScroll });
			return true;
		} else if(ev.target === ev.currentTarget && candidates.length > 0) {
			candidates[0].focus({ preventScroll });
			return true;
		}
	}, [getItemCandidate, getTabbables, markFocused, ref, initialQuerySelector, setTabStop, storeLastFocused]);

	const receiveBlur = useCallback(ev => {
		// ignore blurs to self and descendants
		if(ev.relatedTarget && (ev.relatedTarget === ref.current || ref.current.contains(ev.relatedTarget))) {
			return false;
		}

		setTabStop(null);
		isFocused.current = false;
		ev.currentTarget.tabIndex = originalTabIndex.current;
		return true;
	}, [ref, setTabStop]);

	const receiveMouseDown = useCallback(() => {
		// a press on a part of the container that can't take focus focuses the container itself during the same
		// task, and receiveFocus leaves that focus where it is. The flag is cleared afterwards, as a press that
		// moves no focus must not affect later focus.
		isPressed.current = true;
		setTimeout(() => {
			isPressed.current = false;
		});
	}, []);

	const registerAutoFocus = useCallback(ref => {
		if(ref === null) {
			return;
		}

		if(ref instanceof Element) {
			storeLastFocused(ref);
		}
	}, [storeLastFocused]);

	return useMemo(() => (
			{
				receiveFocus,  receiveBlur,  receiveMouseDown,  focusNext,  focusPrev,  focusBySelector,  resetLastFocused,  registerAutoFocus,  focusOnLast
			}),
		[receiveFocus, receiveBlur, receiveMouseDown, focusNext, focusPrev, focusBySelector, resetLastFocused, registerAutoFocus, focusOnLast]
	);
};

export { useFocusManager };
