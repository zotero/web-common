import React from 'react';

export interface TabProps {
	activateOnFocus?: boolean;
	asSections?: boolean;
	children?: React.ReactNode;
	isActive?: boolean;
	isDisabled?: boolean;
	onActivate: (el: HTMLElement) => void;
	focusNext?: (ev: React.KeyboardEvent) => HTMLElement;
	focusPrev?: (ev: React.KeyboardEvent) => HTMLElement;
	resetLastFocused?: () => void;
}

export const Tab: React.FC<TabProps>;

export interface TabsProps {
	asSections?: boolean;
	children?: React.ReactNode;
	className?: string;
	compact?: boolean;
	justified?: boolean;
	activateOnFocus?: boolean;
}

export const Tabs: React.FC<TabsProps>;

export interface TabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	className?: string;
	isActive?: boolean;
	isLoading?: boolean;
}

export const TabPane: React.ForwardRefExoticComponent<TabPaneProps & React.RefAttributes<HTMLDivElement>>;
