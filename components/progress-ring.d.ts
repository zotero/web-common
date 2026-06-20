import React from 'react';

export interface ProgressRingProps extends React.SVGProps<SVGSVGElement> {
	value?: number;
	max?: number;
	radius?: number;
	strokeWidth?: number;
}

export const ProgressRing: React.ForwardRefExoticComponent<
	ProgressRingProps & React.RefAttributes<SVGSVGElement>
>;
