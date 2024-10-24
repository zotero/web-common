import { useCallback, useMemo, useRef } from 'react';

const isModifierKey = ev => ev.getModifierState("Meta") || ev.getModifierState("Alt") ||
		ev.getModifierState("Control") || ev.getModifierState("OS");


/**
 * React hook to manage focus within a component. Useful for managing focus within lists, toolbars, etc.
 * Both receiveFocus and receiveBlur must be installed on the container element. When the container element
 * receives focus, it will move focus to the first viable candidate, identified either by the tabIndex value
 * or by the initialQuerySelector, except if isFocusable is set to true. In that case, the container itself
 * will be focused and the first call to focusNext will move focus to the first viable candidate.
 * FocusManager remembers the last focused element within the container and will move focus to that element
 * when focus is received again.
 *
 * @param {Object} ref - React ref object pointing to the focusable container.
 * @param {Object} [options] - Configuration options.
 * @param {string|null} [options.initialQuerySelector=null] - Initial query selector to focus on.
 * @param {boolean} [options.isCarousel=true] - Whether the focus should loop around. If isFocusable is true, carousel works forward only.
 * @param {number} [options.targetTabIndex=-2] - The tabIndex value to target for focusable elements.
 * @param {boolean} [options.isFocusable=false] - Whether the container itself is focusable.
 *
 * @returns {Object} - An object containing focus management functions.
 * @returns {Function} return.receiveFocus - Function to handle focus event.
 * @returns {Function} return.receiveBlur - Function to handle blur event.
 * @returns {Function} return.focusNext - Function to focus the next element.
 * @returns {Function} return.focusPrev - Function to focus the previous element.
 * @returns {Function} return.focusBySelector - Function to focus an element by selector or element.
 * @returns {Function} return.resetLastFocused - Function to reset the stored reference to the last focused element.
 * @returns {Function} return.registerAutoFocus - Function to register an element for auto focus.
 * @returns {Function} return.focusOnLast - Function to focus on the last focused element. Both the node and the index within candidates are stored.
 * 											If the node is not found, the index is used to find the node.
 */
const useFocusManager = (ref, { initialQuerySelector = null, isCarousel = true, targetTabIndex = -2, isFocusable = false } = {}) => {
	const isFocused = useRef(false);
	const lastFocused = useRef(null);
	const lastFocusedIndex = useRef(null);
	const originalTabIndex = useRef(null);

	const getTabbables = useCallback(() => {
		return Array.from(
			ref.current.querySelectorAll(`[tabIndex="${targetTabIndex}"]:not([disabled]):not(.offscreen)`)
		).filter(t => t.offsetParent);
	}, [ref, targetTabIndex]);

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
		const nextIndex = tabbables.findIndex(t => t === target) + offset;

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
	}, [getTabbables, isCarousel, storeLastFocused]);

	const focusPrev = useCallback((ev, { useCurrentTarget = true, targetEnd = null, offset = 1 } = {}) => {
		const tabbables = getTabbables();
		if(tabbables.length === 0) {
			return;
		}
		const target = useCurrentTarget ? ev.currentTarget : ev.target;
		const prevIndex = tabbables.findIndex(t => t === target) - offset;
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
	}, [getTabbables, isFocusable, isCarousel, storeLastFocused, ref]);

	const focusBySelector = useCallback(selectorOrEl => {
		const nextEl = typeof(selectorOrEl) === 'string' ?
			ref.current.querySelector(selectorOrEl) :
			selectorOrEl;

		if(nextEl) {
			storeLastFocused(nextEl);
			nextEl.focus();
		}
	}, [ref, storeLastFocused]);

	const focusOnLast  = useCallback(() => {
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

	const receiveFocus = useCallback((ev, isBounced = false) => {
		ev.stopPropagation();

		if(isFocused.current) {
			return false;
		}


		if(ref.current === null && !isBounced) {
			ev.persist();
			setTimeout(() => receiveFocus(ev, true));
			return;
		}

		if(ref.current === null && isBounced) {
			return;
		}

		if(!ref.current.dataset.focusRoot) {
			// we have not yet focused on this item yet, store original tabIndex and mark as focus root
			ref.current.dataset.focusRoot = '';
			originalTabIndex.current = originalTabIndex.current === null ? ref.current.tabIndex : originalTabIndex.current;
		}

		isFocused.current = true;
		if(ref.current.tabIndex >= 0) {
			ref.current.tabIndex = -1;
		}

		if (isFocusable) {
			return;
		}

		if(lastFocused.current === null && initialQuerySelector !== null) {
			if(typeof(initialQuerySelector) === 'object' && initialQuerySelector.current && 'focus' in initialQuerySelector.current) {
				// pased as a ref
				storeLastFocused(initialQuerySelector.current);
			} else if (Array.isArray(initialQuerySelector) || typeof(initialQuerySelector) === 'string') {
				//passed as a string or array of strings
				if(!Array.isArray(initialQuerySelector)) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					initialQuerySelector = [initialQuerySelector];
				}
				for (let i = 0; i < initialQuerySelector.length; i++) {
					const nextSelector = initialQuerySelector[i];
					const candidate = ref.current.querySelector(nextSelector);
					if(candidate) {
						storeLastFocused(candidate);
						break;
					}
				}
			}

			if(lastFocused.current) {
				lastFocused.current.focus();
				return true;
			}
		}

		const candidates = Array.from(ref.current.querySelectorAll(`[tabIndex="${targetTabIndex}"]:not([disabled])`));
		if(lastFocused.current !== null && candidates.includes(lastFocused.current)) {
			lastFocused.current.focus();
			return true;
		} else if(ev.target !== ev.currentTarget && candidates.includes(ev.target)) {
			// keep the focus on the candidate pressed
			return true;
		} else if(ev.target === ev.currentTarget && candidates.length > 0) {
			candidates[0].focus();
			return true;
		}
	}, [ref, initialQuerySelector]);

	const receiveBlur = useCallback(ev => {
		// ignore blurs to self and descendants
		if(ev.relatedTarget && (ev.relatedTarget === ref.current || ref.current.contains(ev.relatedTarget))) {
			return false;
		}

		isFocused.current = false;
		ev.currentTarget.tabIndex = originalTabIndex.current;
		return true;
	}, [ref]);

	const registerAutoFocus = useCallback(ref => {
		if(ref === null) {
			return;
		}

		if(ref instanceof Element) {
			storeLastFocused(ref);
		}
	}, [storeLastFocused]);

	const focusManagerFunctions = useMemo(() => (
		{ receiveFocus, receiveBlur, focusNext, focusPrev, focusBySelector, resetLastFocused, registerAutoFocus, focusOnLast }),
		[receiveFocus, receiveBlur, focusNext, focusPrev, focusBySelector, resetLastFocused, registerAutoFocus, focusOnLast]
	);

	return focusManagerFunctions;
};

export { useFocusManager };
