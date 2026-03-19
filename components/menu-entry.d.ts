import React from 'react';

export interface MenuEntryProps {
	active?: boolean;
	className?: string;
	dropdown?: boolean;
	entries?: Array<{ href?: string; label?: string; separator?: boolean }>;
	href?: string;
	label?: string;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
	position?: 'left' | 'right';
	truncate?: boolean;
}

export const MenuEntry: React.FC<MenuEntryProps>;
