import React from 'react';

export interface SpinnerProps extends React.AriaAttributes {
	label?: string | null;
	small?: boolean;
	large?: boolean;
	xlarge?: boolean;
	className?: string;
	style?: React.CSSProperties;
	[dataAttribute: `data-${string}`]: unknown;
}

export const Spinner: React.ForwardRefExoticComponent<
	SpinnerProps & React.RefAttributes<SVGSVGElement>
>;
