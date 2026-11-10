import React from 'react';

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectOptionProps {
	id?: string;
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
	/** Set on the combobox element, so that a `<label htmlFor>` can name a searchable Select. */
	id?: string;
	onBlur?: (ev: React.FocusEvent) => void;
	onChange?: (value: string) => void;
	onFocus?: (ev: React.FocusEvent) => void;
	options?: SelectOption[];
	readOnly?: boolean;
	searchable?: boolean;
	tabIndex?: number;
	value?: string;
	valuePrefix?: React.ReactNode;
}

/**
 * Name a Select with `aria-label` or `aria-labelledby`, which name both the combobox and its listbox.
 * A searchable Select that is not read-only can instead be named by a `<label htmlFor>` pointing at its
 * `id`. A native label cannot name a non-searchable or read-only Select, and wrapping a Select in a
 * `<label>` is not supported.
 */
export const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<SelectImperativeHandle>>;
