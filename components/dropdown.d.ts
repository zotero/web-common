import React from 'react';

export interface DropdownContextValue {
	handleToggle: (ev: React.SyntheticEvent) => void;
	isOpen: boolean;
	x: number | null;
	y: number | null;
	refs: {
		setReference: (el: HTMLElement | null) => void;
		setFloating: (el: HTMLElement | null) => void;
		floating: React.MutableRefObject<HTMLElement | null>;
	};
	strategy: 'absolute' | 'fixed';
	update: () => void;
	isReady: boolean;
	portal: boolean | HTMLElement;
}

export const DropdownContext: React.Context<DropdownContextValue>;

export interface DropdownProps {
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	isOpen?: boolean;
	maxHeight?: number | boolean;
	onToggle?: (ev: React.SyntheticEvent) => void;
	portal?: boolean | HTMLElement;
	placement?: string;
	strategy?: 'absolute' | 'fixed';
}

export const Dropdown: React.FC<DropdownProps>;

export interface DropdownToggleProps {
	tag?: React.ElementType;
	children?: React.ReactNode;
	className?: string;
	onClick?: (ev: React.MouseEvent) => void;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
	tabIndex?: number;
	title?: string;
}

export const DropdownToggle: React.ForwardRefExoticComponent<DropdownToggleProps & React.RefAttributes<HTMLElement>>;

export interface DropdownMenuProps {
	children?: React.ReactNode;
	className?: string;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps>;

export interface DropdownItemProps {
	disabled?: boolean;
	divider?: boolean;
	role?: string;
	children?: React.ReactNode;
	className?: string;
	onClick?: (ev: React.MouseEvent | React.KeyboardEvent) => void;
	tag?: React.ElementType;
}

export const DropdownItem: React.FC<DropdownItemProps>;

export interface UncontrolledDropdownProps extends Omit<DropdownProps, 'isOpen' | 'onToggle'> {}

export const UncontrolledDropdown: React.FC<UncontrolledDropdownProps>;
