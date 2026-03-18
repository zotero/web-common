import React from 'react';

export interface IconProps {
	type: string;
	className?: string;
	color?: string;
	colorScheme?: string;
	height?: number | string;
	width?: number | string;
	label?: string;
	role?: string;
	style?: React.CSSProperties;
	symbol?: string;
	usePixelRatio?: boolean;
	useColorScheme?: boolean;
	viewBox?: string;
}

export const Icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
