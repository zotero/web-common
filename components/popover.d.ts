import React from 'react';

export interface PopoverContextValue {
	isOpen: boolean;
	disabled: boolean;
	handleToggle: (ev: React.SyntheticEvent) => void;
	dialogId: string;
	placement: string;
	x: number | null;
	y: number | null;
	strategy: 'absolute' | 'fixed';
	refs: {
		setReference: (el: HTMLElement | null) => void;
		setFloating: (el: HTMLElement | null) => void;
		reference: React.MutableRefObject<HTMLElement | null>;
		floating: React.MutableRefObject<HTMLElement | null>;
	};
	triggerRef: React.MutableRefObject<HTMLElement | null>;
	arrowRef: React.MutableRefObject<HTMLElement | null>;
	middlewareData: Record<string, unknown>;
	update: () => void;
	isReady: boolean;
	arrow: boolean;
	trapFocus: boolean;
	dismissOnEscape: boolean;
	portal?: boolean | HTMLElement;
}

export const PopoverContext: React.Context<PopoverContextValue>;

export interface PopoverProps {
	children?: React.ReactNode;
	isOpen?: boolean;
	onToggle?: (ev: React.SyntheticEvent) => void;
	disabled?: boolean;
	placement?: string;
	strategy?: 'absolute' | 'fixed';
	arrow?: boolean;
	shift?: boolean | { padding?: number };
	flip?: boolean;
	trapFocus?: boolean;
	autoFocus?: boolean;
	dismissOnOutsideClick?: boolean;
	dismissOnEscape?: boolean;
	portal?: boolean | HTMLElement;
}

export const Popover: React.FC<PopoverProps>;

export interface PopoverTriggerProps {
	tag?: React.ElementType;
	children?: React.ReactNode;
	className?: string;
	icon?: boolean;
	onClick?: (ev: React.MouseEvent) => void;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
	tabIndex?: number;
	title?: string;
}

export const PopoverTrigger: React.ForwardRefExoticComponent<PopoverTriggerProps & React.RefAttributes<HTMLElement>>;

export interface PopoverDialogProps {
	children?: React.ReactNode;
	className?: string;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
	'aria-label'?: string;
}

export const PopoverDialog: React.FC<PopoverDialogProps>;

export interface PopoverHeaderProps {
	tag?: React.ElementType;
	children?: React.ReactNode;
	className?: string;
}

export const PopoverHeader: React.FC<PopoverHeaderProps>;

export interface PopoverBodyProps {
	children?: React.ReactNode;
	className?: string;
}

export const PopoverBody: React.FC<PopoverBodyProps>;

export interface UncontrolledPopoverProps extends Omit<PopoverProps, 'isOpen' | 'onToggle'> {}

export const UncontrolledPopover: React.FC<UncontrolledPopoverProps>;
