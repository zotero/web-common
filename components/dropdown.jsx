import {
	createContext, forwardRef, memo, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
} from 'react';
import {createPortal} from 'react-dom';
import {flip, shift, size, useFloating} from '@floating-ui/react-dom';
import cx from 'classnames';

import {useFocusManager, usePrevious} from '../hooks';
import {Button} from './button';
import {pick} from '../utils/immutable';
import {isTriggerEvent} from '../utils/event';

export const DropdownContext = createContext({});

export const Dropdown = memo(props => {
	const ref = useRef(null);
	const isKeyboardTrigger = useRef(false);
	const pendingFocus = useRef(false);
	const pendingReturnFocus = useRef(false);
	const {
		disabled, isOpen, onToggle, className, placement = 'bottom-start',
		strategy: strategyProp, maxHeight, portal, ...rest
	} = props;
	const wasOpen = usePrevious(isOpen);
	const [isReady, setIsReady] = useState(false);
	const [toggleCount, setToggleCount] = useState(0); // toggleCount is used to trigger an effect when isOpen doesn't change
	const middleware = [flip({fallbackAxisSideDirection: 'end'}), shift()];
	// `maxHeight` can be a number in px or if is set to true, use the available height minus some padding
	if (maxHeight) {
		middleware.push(size({
			apply({availableHeight, elements}) {
				Object.assign(elements.floating.style, {
					overflow: 'auto',
					maxHeight: typeof (maxHeight) === 'number' ? `${maxHeight}px` : `${availableHeight - 8}px`,
				});
			}
		}));
	}

	const {x, y, refs, strategy, update} = useFloating({placement, strategy: strategyProp, middleware});

	const handleToggle = useCallback(ev => {
		if (disabled) {
			return;
		}

		if (isTriggerEvent(ev) || (ev.type === 'keydown' && (['ArrowUp', 'ArrowDown', 'Escape', 'Enter', 'Tab', ' '].includes(ev.key)))) {
			if (!isOpen && (ev.key === 'Tab' || ev.key === 'Escape')) {
				return;
			}

			isKeyboardTrigger.current = ev.type === 'keydown';
			if (!isOpen) {
				pendingFocus.current = true;
				setIsReady(false);
			} else {
				pendingReturnFocus.current = true;
			}

			setToggleCount(c => c + 1);
			onToggle?.(ev);
			if (ev.key !== 'Tab') {
				ev.stopPropagation();
				ev.preventDefault();
			}
		}
	}, [disabled, isOpen, onToggle]);

	const handleDocumentEvent = useCallback(ev => {

		if (ev.type === 'click' && ev.button === 2) {
			return;
		}

		if (ev.type === 'keyup' && ev.key !== 'Tab') {
			return;
		}

		if (ev.target?.closest?.('.dropdown') === ref.current) {
			return;
		}

		if (refs.floating.current?.contains(ev.target)) {
			return;
		}

		onToggle?.(ev);

	}, [onToggle, refs]);

	useEffect(() => {
		if (isOpen !== wasOpen && typeof wasOpen !== 'undefined') {
			update();
			setIsReady(true);
		} else if (isOpen) {
			// toggle was requested, but isOpen didn't change - restore isReady
			update();
			setIsReady(true);
		}
	}, [isOpen, update, wasOpen, toggleCount]);

	useLayoutEffect(() => {
		if (isOpen && isReady && pendingFocus.current) {
			pendingFocus.current = false;
			(refs.floating.current ?? ref.current.querySelector('[role="menu"]'))?.focus({ preventScroll: true });
		}
		if (wasOpen && !isOpen && pendingReturnFocus.current) {
			pendingReturnFocus.current = false;
			const toggle = ref.current?.querySelector('[aria-haspopup="true"]');
			if (toggle) {
				// Only return focus to the toggle if the focus is still within the dropdown
				// (either in the container or the floating portal). If focus has moved
				// elsewhere (e.g. a modal opened by a menu action), don't steal it.
				const active = document.activeElement;
				if (!active || active === document.body || ref.current?.contains(active) || refs.floating.current?.contains(active)) {
					// Ensure the toggle is visible before focusing it. This fixes dropdowns
					// where the toggle only appears on focus/hover and the dropdown-menu is portalled
					// (e.g., the collections-tree "More" dropdown in the web library)
					toggle.style.setProperty('visibility', 'visible');
					toggle.focus({ preventScroll: true });
					toggle.style.removeProperty('visibility');
				}
			}
		}
	}, [isOpen, isReady, refs, wasOpen]);

	useEffect(() => {
		if (isOpen) {
			// Only listen for 'click' -- not 'touchstart'. On touch devices, a tap
			// produces both touchstart and click. Using click avoids a race where
			// the capture-phase touchstart on a just-opened menu item could fire
			// before React has finished committing the open state, and also avoids
			// closing the dropdown when the user merely scrolls outside of it.
			document.addEventListener('click', handleDocumentEvent, { passive: true, capture: true });
		} else {
			['click', 'keyup'].forEach(evType =>
				document.removeEventListener(evType, handleDocumentEvent, { capture: true })
			);
		}

		return () => {
			['click', 'keyup'].forEach(evType =>
				document.removeEventListener(evType, handleDocumentEvent, { capture: true })
			);
		}

	}, [isOpen, handleDocumentEvent]);

	return (
		<DropdownContext.Provider
			value={{handleToggle, isOpen, x, y, refs, strategy, update, isReady, portal}}>
			<div
				ref={ref}
				className={cx('dropdown', className, {
					'show': isOpen,
				})}
				{...pick(rest, p => p.startsWith('data-'))}
			>
				{props.children}
			</div>
		</DropdownContext.Provider>
	)
});

Dropdown.displayName = 'Dropdown';

export const DropdownToggle = memo(forwardRef((props, ref) => {
	const {className, tabIndex, title, onKeyDown, onClick, ...rest} = props;
	const Tag = props.tag || Button;
	const {isOpen, refs, handleToggle} = useContext(DropdownContext);


	const handleClick = useCallback(ev => {
		onClick?.(ev);
		if (!ev.defaultPrevented) {
			handleToggle(ev);
		}
	}, [handleToggle, onClick]);

	const handleKeyDown = useCallback(ev => {
		onKeyDown?.(ev);

		if (['ArrowUp', 'ArrowDown', 'Escape', 'Enter', 'Tab', ' '].includes(ev.key)) {
			handleToggle(ev);
		}

	}, [handleToggle, onKeyDown]);

	return (
		<Tag
			{...rest}
			title={title}
			aria-expanded={isOpen}
			aria-haspopup={true}
			className={className}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={r => {
				refs.setReference?.(r);
				ref instanceof Function ? ref(r) : ref ? ref.current = r : null
			}}
			tabIndex={tabIndex}
		>
			{props.children}
		</Tag>
	)
}));

DropdownToggle.displayName = 'DropdownToggle';

export const DropdownMenu = memo(props => {
	const {className, onKeyDown: onKeyDownProp, ...rest} = props;
	const ref = useRef(null);

	const {isOpen, x, y, isReady, strategy, refs, handleToggle, portal} = useContext(DropdownContext);
	const {
		focusNext,
		focusPrev,
		receiveBlur,
		receiveFocus,
		resetLastFocused
	} = useFocusManager(ref, {initialQuerySelector: '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'});
	const wasOpen = usePrevious(isOpen);

	const handleKeyDown = useCallback(ev => {
		onKeyDownProp?.(ev);
		if (ev.defaultPrevented) {
			return;
		}
		if (ev.key === 'ArrowDown') {
			focusNext(ev, {useCurrentTarget: false});
			ev.stopPropagation();
		} else if (ev.key === 'ArrowUp') {
			focusPrev(ev, {useCurrentTarget: false});
			ev.stopPropagation();
		} else if (ev.key === 'Escape' || ev.key === 'Tab') {
			handleToggle(ev);
		}
	}, [focusNext, focusPrev, handleToggle, onKeyDownProp]);

	const handleReceiveFocus = useCallback(ev => {
		if (ev.target !== ev.currentTarget) {
			ev.stopPropagation();
			return;
		}
		receiveFocus(ev, { preventScroll: true });
	}, [receiveFocus]);

	useEffect(() => {
		if (wasOpen && !isOpen) {
			resetLastFocused();
		}
	}, [isOpen, resetLastFocused, wasOpen]);

	const menu = (
		<div
			suppressHydrationWarning={true}
			role="menu"
			aria-hidden={!isOpen}
			ref={r => {
				refs.setFloating(r);
				ref.current = r
			}}
			style={{position: strategy, transform: (isOpen && isReady) ? `translate3d(${x}px, ${y}px, 0px)` : ''}}
			className={cx('dropdown-menu', className, {
				'show': (isOpen && isReady),
				'portal': portal,
			})}
			tabIndex={-1}
			onFocus={handleReceiveFocus}
			onBlur={receiveBlur}
			onKeyDown={handleKeyDown}
			{...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-'))}
		>
			{props.children}
		</div>
	);

	if (portal) {
		return createPortal(menu, typeof portal === 'object' ? portal : document.body);
	}

	return menu;
});

DropdownMenu.displayName = 'DropdownMenu';

export const DropdownItem = memo(props => {
	const ref = useRef(null);
	const {children, className, onClick, disabled = false, role = 'menuitem', tag, divider, ...rest} = props;
	const Tag = tag ?? (divider ? 'div' : 'button');

	const {handleToggle} = useContext(DropdownContext);

	const handleKeyDown = useCallback(ev => {
		if (disabled) {
			return;
		}

		if (ev.key === ' ' || ev.key === 'Enter') {
			if (tag === 'a') {
				ref.current.click();
				ev.preventDefault();
				return;
			}
			onClick?.(ev);

			if (!ev.defaultPrevented) {
				setTimeout(() => handleToggle(ev), 0);
			}
			ev.preventDefault();
		}
	}, [disabled, handleToggle, onClick, tag]);

	const handleClick = useCallback(ev => {
		if (disabled) {
			return;
		}
		onClick?.(ev);
		if (!ev.defaultPrevented) {
			// make sure default behaviour such as clicking a link runs first, then close the dropdown
			setTimeout(() => handleToggle(ev), 0);
		}
	}, [disabled, handleToggle, onClick]);

	return (
		<Tag
			{...rest}
			className={cx(className, {
				'disabled': disabled,
				'dropdown-item': !divider,
				'dropdown-divider': divider,
			})}
			disabled={Tag === 'button' ? disabled : null}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={divider ? null : -2}
			role={role}
			ref={ref}
		>
			{children}
		</Tag>
	)
});

DropdownItem.displayName = 'DropdownItem';

export const UncontrolledDropdown = memo(props => {
	const [isOpen, setIsOpen] = useState(false);

	const handleToggleDropdown = useCallback(() => {
		setIsOpen(isOpen => !isOpen);
	}, []);

	return (
		<Dropdown
			{...props}
			onToggle={handleToggleDropdown}
			isOpen={isOpen}
		>
			{props.children}
		</Dropdown>
	);
});

UncontrolledDropdown.displayName = 'UncontrolledDropdown';

