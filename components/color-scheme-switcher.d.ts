import React from 'react';

import { SwitcherProps } from './switcher';

export interface ColorSchemeSwitcherProps extends Omit<SwitcherProps, 'checked' | 'onToggle'> {
	mode?: 'light' | 'dark';
	onToggle?: (mode: 'light' | 'dark') => void;
	lightIcon?: React.ReactNode;
	darkIcon?: React.ReactNode;
}

export const ColorSchemeSwitcher: React.ForwardRefExoticComponent<ColorSchemeSwitcherProps & React.RefAttributes<HTMLButtonElement>>;
