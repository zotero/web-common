import React from 'react';

export interface SwitcherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	checked?: boolean;
	onToggle?: (checked: boolean) => void;
	className?: string;
}

export const Switcher: React.ForwardRefExoticComponent<SwitcherProps & React.RefAttributes<HTMLButtonElement>>;

