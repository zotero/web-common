import React from 'react';

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectOptionProps {
	isHighlighted?: boolean;
	onMouseDown?: (ev: React.MouseEvent) => void;
	option?: SelectOption;
	isSelected?: boolean;
	onTrigger?: (ev: React.SyntheticEvent) => void;
}

export const SelectOption: React.FC<SelectOptionProps>;

export const SelectDivider: React.FC;

export interface SelectImperativeHandle {
	getElement(): HTMLDivElement | null;
	focus(): void;
}

export interface SelectProps {
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	id?: string;
	onBlur?: (ev: React.FocusEvent) => void;
	onChange?: (value: string) => void;
	onFocus?: (ev: React.FocusEvent) => void;
	options?: SelectOption[];
	readOnly?: boolean;
	searchable?: boolean;
	tabIndex?: number;
	value?: string;
}

export const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<SelectImperativeHandle>>;
