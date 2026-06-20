import {
	createContext, forwardRef, memo, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { arrow as arrowMiddleware, flip as flipMiddleware, shift as shiftMiddleware, useFloating } from '@floating-ui/react-dom';
import cx from 'classnames';

import { usePrevious } from '../hooks';
import { Button } from './button';
import { FocusTrap } from './focus-trap';
import { pick } from '../utils/immutable';
import { isTriggerEvent } from '../utils/event';
import { focusableSelector } from '../utils/dom';

export const PopoverContext = createContext({});

export const Popover = memo(props => {
	const {
		isOpen, onToggle, disabled = false, placement = 'bottom-start', strategy: strategyProp,
		arrow = true, shift = false, flip = false, trapFocus = false, autoFocus = true,
		dismissOnOutsideClick = true, dismissOnEscape = true, portal, children,
	} = props;

	const dialogId = useId();
	const triggerRef = useRef(null);
	const arrowRef = useRef(null);
	const pendingFocus = useRef(false);
	const pendingReturnFocus = useRef(false);
	const wasOpen = usePrevious(isOpen);
	const [isReady, setIsReady] = useState(false);
	// toggleCount lets the positioning effect re-run even when isOpen does not change
	const [toggleCount, setToggleCount] = useState(0);

	const middleware = [];
	if (flip) {
		middleware.push(flipMiddleware({ fallbackAxisSideDirection: 'end' }));
	}
	if (shift) {
		middleware.push(shiftMiddleware(typeof shift === 'object' ? shift : undefined));
	}
	if (arrow) {
		middleware.push(arrowMiddleware({ element: arrowRef }));
	}

	const { x, y, refs, strategy, update, middlewareData } = useFloating({ placement, strategy: strategyProp, middleware });

	const handleToggle = useCallback(ev => {
		if (disabled) {
			return;
		}

		if (isTriggerEvent(ev) || (ev.type === 'keydown' && ['ArrowDown', 'Escape', 'Enter', 'Tab', ' '].includes(ev.key))) {
			if (!isOpen && (ev.key === 'Tab' || ev.key === 'Escape')) {
				return;
			}

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

		if (triggerRef.current?.contains(ev.target)) {
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
			// toggle was requested, but isOpen did not change -- restore isReady
			update();
			setIsReady(true);
		}
	}, [isOpen, update, wasOpen, toggleCount]);

	useLayoutEffect(() => {
		if (isOpen && isReady && pendingFocus.current) {
			pendingFocus.current = false;
			if (autoFocus) {
				const dialog = refs.floating.current;
				if (dialog) {
					(dialog.querySelector(focusableSelector) ?? dialog).focus({ preventScroll: true });
				}
			}
		}
		if (wasOpen && !isOpen && pendingReturnFocus.current) {
			pendingReturnFocus.current = false;
			const trigger = triggerRef.current;
			if (trigger) {
				// Only return focus to the trigger if focus is still within the popover, i.e. it has not
				// deliberately moved elsewhere (e.g. into a modal opened from the popover content).
				const active = document.activeElement;
				if (!active || active === document.body || refs.floating.current?.contains(active)) {
					trigger.focus({ preventScroll: true });
				}
			}
		}
	}, [isOpen, isReady, refs, wasOpen, autoFocus]);

	useEffect(() => {
		if (isOpen && dismissOnOutsideClick) {
			// Listen for 'click' only (not 'touchstart'): on touch devices a tap fires both, and the
			// capture-phase touchstart can arrive before React commits the open state. Using click also
			// avoids closing the popover when the user merely scrolls outside of it.
			document.addEventListener('click', handleDocumentEvent, { passive: true, capture: true });
		} else {
			document.removeEventListener('click', handleDocumentEvent, { capture: true });
		}

		return () => {
			document.removeEventListener('click', handleDocumentEvent, { capture: true });
		};
	}, [isOpen, dismissOnOutsideClick, handleDocumentEvent]);

	return (
		<PopoverContext.Provider
			value={{
				isOpen, disabled, handleToggle, dialogId, placement, x, y, strategy,
				refs, triggerRef, arrowRef, middlewareData, update, isReady, arrow, trapFocus, dismissOnEscape, portal,
			}}
		>
			{children}
		</PopoverContext.Provider>
	);
});

Popover.displayName = 'Popover';

export const PopoverTrigger = memo(forwardRef((props, ref) => {
	const { tag, className, tabIndex, title, onKeyDown, onClick, children, ...rest } = props;
	const Tag = tag || Button;
	const { isOpen, dialogId, refs, triggerRef, handleToggle } = useContext(PopoverContext);

	const handleClick = useCallback(ev => {
		onClick?.(ev);
		if (!ev.defaultPrevented) {
			handleToggle(ev);
		}
	}, [handleToggle, onClick]);

	const handleKeyDown = useCallback(ev => {
		onKeyDown?.(ev);
		if (['ArrowDown', 'Escape', 'Enter', 'Tab', ' '].includes(ev.key)) {
			handleToggle(ev);
		}
	}, [handleToggle, onKeyDown]);

	return (
		<Tag
			{...rest}
			title={title}
			aria-controls={dialogId}
			aria-expanded={isOpen}
			aria-haspopup="dialog"
			className={cx('popover-trigger', className)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={r => {
				refs.setReference?.(r);
				if (triggerRef) {
					triggerRef.current = r;
				}
				ref instanceof Function ? ref(r) : ref ? ref.current = r : null;
			}}
			tabIndex={tabIndex}
		>
			{children}
		</Tag>
	);
}));

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverDialog = memo(props => {
	const { className, children, onKeyDown: onKeyDownProp, ...rest } = props;
	const ref = useRef(null);
	const {
		isOpen, isReady, dialogId, placement, x, y, strategy, refs,
		arrowRef, middlewareData, arrow, trapFocus, dismissOnEscape, handleToggle, portal,
	} = useContext(PopoverContext);

	const side = placement.split('-')[0];

	const handleKeyDown = useCallback(ev => {
		onKeyDownProp?.(ev);
		if (ev.defaultPrevented) {
			return;
		}
		if (ev.key === 'Escape' && dismissOnEscape) {
			handleToggle(ev);
		}
	}, [dismissOnEscape, handleToggle, onKeyDownProp]);

	const dialog = (
		<div
			id={dialogId}
			role="dialog"
			aria-hidden={!isOpen}
			inert={trapFocus ? !isOpen : undefined}
			tabIndex={-1}
			ref={r => {
				refs.setFloating(r);
				ref.current = r;
			}}
			className={cx('popover', `popover-${side}`, className, { show: isOpen && isReady })}
			style={{ position: strategy, transform: (isOpen && isReady) ? `translate3d(${x}px, ${y}px, 0px)` : '' }}
			onKeyDown={handleKeyDown}
			{...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-'))}
		>
			<div className="popover-inner" role="tooltip">
				{children}
			</div>
			{arrow && (
				<span
					className="popover-arrow"
					ref={arrowRef}
					style={{ left: middlewareData?.arrow?.x, top: middlewareData?.arrow?.y }}
				/>
			)}
		</div>
	);

	const content = trapFocus ? <FocusTrap disabled={!isOpen}>{dialog}</FocusTrap> : dialog;

	if (portal) {
		return createPortal(content, typeof portal === 'object' ? portal : document.body);
	}

	return content;
});

PopoverDialog.displayName = 'PopoverDialog';

export const PopoverHeader = memo(props => {
	const { tag, className, children, ...rest } = props;
	const Tag = tag || 'h3';
	return (
		<Tag
			className={cx('popover-header', className)}
			{...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-'))}
		>
			{children}
		</Tag>
	);
});

PopoverHeader.displayName = 'PopoverHeader';

export const PopoverBody = memo(props => {
	const { className, children, ...rest } = props;
	return (
		<div
			className={cx('popover-body', className)}
			{...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-'))}
		>
			{children}
		</div>
	);
});

PopoverBody.displayName = 'PopoverBody';

export const UncontrolledPopover = memo(props => {
	const [isOpen, setIsOpen] = useState(false);

	const handleToggle = useCallback(() => {
		setIsOpen(open => !open);
	}, []);

	return (
		<Popover { ...props } isOpen={ isOpen } onToggle={ handleToggle }>
			{ props.children }
		</Popover>
	);
});

UncontrolledPopover.displayName = 'UncontrolledPopover';
