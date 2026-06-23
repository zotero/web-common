import {
	createContext, forwardRef, memo, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { arrow as arrowMiddleware, flip as flipMiddleware, shift as shiftMiddleware, useFloating } from '@floating-ui/react-dom';
import cx from 'classnames';

import { Button } from './button';
import { FocusTrap } from './focus-trap';
import { pick } from '../utils/immutable';
import { isTriggerEvent } from '../utils/event';
import { focusableSelector } from '../utils/dom';
import { mergeRefs } from '../utils/react';

// Keep the arrow this many px clear of the popover's rounded corners (generally
// the border radius multiplied by two). If `$popover-border-radius` is modified
// in CSS, `arrowPadding` should also be provided by the consumer.
const ARROW_PADDING = 6;

export const PopoverContext = createContext({});

export const Popover = memo(props => {
	const {
		isOpen, onToggle, disabled = false, placement = 'bottom-start', strategy: strategyProp,
		arrow = true, arrowPadding = ARROW_PADDING, shift = false, flip = false, trapFocus = false, autoFocus = true,
		dismissOnOutsideClick = true, dismissOnEscape = true, portal, children,
	} = props;

	const dialogId = useId();
	const triggerRef = useRef(null);
	const arrowRef = useRef(null);
	const pendingFocus = useRef(false);
	const prevIsOpen = useRef(isOpen);
	const [isReady, setIsReady] = useState(false);
	// toggleCount lets the positioning effect re-run even when isOpen does not change
	const [toggleCount, setToggleCount] = useState(0);

	const middleware = useMemo(() => {
		const m = [];
		if (flip) {
			m.push(flipMiddleware({ fallbackAxisSideDirection: 'end' }));
		}
		if (shift) {
			m.push(shiftMiddleware(typeof shift === 'object' ? shift : undefined));
		}
		if (arrow) {
			m.push(arrowMiddleware({ element: arrowRef, padding: arrowPadding }));
		}
		return m;
	}, [flip, shift, arrow, arrowPadding]);

	const { placement: resolvedPlacement, x, y, refs, strategy, update, middlewareData } = useFloating({ placement, strategy: strategyProp, middleware });

	const handleToggle = useCallback(ev => {
		if (disabled) {
			return;
		}

		if (isTriggerEvent(ev) || (ev.type === 'keydown' && ['ArrowDown', 'Escape', 'Enter', 'Tab', ' '].includes(ev.key))) {
			if (!isOpen && (ev.key === 'Tab' || ev.key === 'Escape')) {
				return;
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
		if (isOpen) {
			update();
			setIsReady(true);
		}
	}, [isOpen, update, toggleCount]);

	useLayoutEffect(() => {
		const wasOpen = prevIsOpen.current;
		if (isOpen === wasOpen) {
			return;
		}
		prevIsOpen.current = isOpen;

		if (isOpen) {
			pendingFocus.current = true;
		} else {
			pendingFocus.current = false;
			setIsReady(false);
			const trigger = triggerRef.current;
			const active = document.activeElement;
			if (trigger && (!active || active === document.body || refs.floating.current?.contains(active))) {
				trigger.focus({ preventScroll: true });
			}
		}
	}, [isOpen, refs]);

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
	}, [isOpen, isReady, refs, autoFocus]);

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
				isOpen, disabled, handleToggle, dialogId, placement: resolvedPlacement, x, y, strategy,
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
	const { isOpen, disabled, dialogId, refs, triggerRef, handleToggle } = useContext(PopoverContext);
	const isNativeButton = Tag === Button || Tag === 'button';

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
			aria-disabled={!isNativeButton && disabled ? true : undefined}
			disabled={isNativeButton ? disabled : undefined}
			className={cx('popover-trigger', className, { disabled })}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			ref={mergeRefs(refs.setReference, triggerRef, ref)}
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
			<div className="popover-inner">
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
