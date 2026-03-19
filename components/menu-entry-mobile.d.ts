import React from 'react';

export interface MobileMenuEntryProps {
	className?: string;
	href?: string;
	label?: string;
	onKeyDown?: (ev: React.KeyboardEvent) => void;
}

export const MobileMenuEntry: React.FC<MobileMenuEntryProps>;
