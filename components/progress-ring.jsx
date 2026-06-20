import { memo, forwardRef } from 'react';
import cx from 'classnames';
import { clamp, pick } from '../utils';

const ProgressRing = memo(forwardRef((props, ref) => {
	const { className, value = 0, max = 1, radius = 7, strokeWidth = 2, style, ...rest } = props;

	const numericValue = Number.isFinite(value) ? value : 0;
	const numericMax = Number.isFinite(max) ? max : 1;
	const size = 2 * radius + strokeWidth;
	const center = size / 2;
	const circumference = 2 * Math.PI * radius;
	const fraction = numericMax > 0 ? clamp(numericValue / numericMax, 0, 1) : 0;
	const offset = circumference * (1 - fraction);
	const ariaMax = numericMax > 0 ? numericMax : 1;
	const ariaValue = clamp(numericValue, 0, ariaMax);

	return (
		<svg
			ref={ ref }
			className={ cx('progress-ring', className) }
			style={ style }
			width={ size }
			height={ size }
			viewBox={ `0 0 ${size} ${size}` }
			{ ...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-')) }
			role="progressbar"
			aria-valuenow={ ariaValue }
			aria-valuemin={ 0 }
			aria-valuemax={ ariaMax }
		>
			<circle
				className="progress-ring-track"
				cx={ center }
				cy={ center }
				r={ radius }
				strokeWidth={ strokeWidth }
				fill="none"
			/>
			<circle
				className="progress-ring-fill"
				cx={ center }
				cy={ center }
				r={ radius }
				strokeWidth={ strokeWidth }
				fill="none"
				strokeDasharray={ circumference }
				strokeDashoffset={ offset }
				transform={ `rotate(-90 ${center} ${center})` }
			/>
		</svg>
	);
}));

ProgressRing.displayName = 'ProgressRing';

export { ProgressRing };
