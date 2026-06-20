import React from 'react';

export interface ProgressRingProps extends React.AriaAttributes {
	value?: number;
	max?: number;
	radius?: number;
	strokeWidth?: number;
	className?: string;
	style?: React.CSSProperties;
	[dataAttribute: `data-${string}`]: unknown;
}

export const ProgressRing: React.ForwardRefExoticComponent<
	ProgressRingProps & React.RefAttributes<SVGSVGElement>
>;
