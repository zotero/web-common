import { memo, forwardRef } from 'react';
import cx from 'classnames';
import { pick } from '../utils';

const DEFAULT_LABEL = 'Loading';

// Inline SVG rotated via a CSS animation. All geometry is driven by
// _spinner.scss. Each preset class sizes the box and the circle's radius,
// stroke and dash pattern, with the circle centred via `cx`/`cy`. The
// smallest requested preset wins when several are passed.
// Labelled with `DEFAULT_LABEL` unless `label`, `aria-label` or `aria-labelledby` is
// given or the spinner is `aria-hidden`. An empty or null label, without
// `aria-labelledby`, hides it from assistive technology.
const Spinner = memo(forwardRef((props, ref) => {
	const { className, label, small, large, xlarge, style, ...rest } = props;

	const preset = (small && 'small') || (large && 'large') || (xlarge && 'xlarge');
	const isHidden = [true, 'true'].includes(rest['aria-hidden']);
	const hasDefaultLabel = !isHidden && [label, rest['aria-label'], rest['aria-labelledby']].every(v => v === undefined);
	const ariaLabel = hasDefaultLabel ? DEFAULT_LABEL : (label || rest['aria-label'] || null);
	const ariaHidden = rest['aria-hidden'] ?? (!ariaLabel && !rest['aria-labelledby'] ? true : undefined);

	return (
		<svg
			ref={ ref }
			className={ cx('spinner', preset, className) }
			style={ style }
			{ ...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-')) }
			aria-label={ ariaLabel }
			aria-hidden={ ariaHidden }
			role="progressbar"
		>
			<circle />
		</svg>
	);
}));

Spinner.displayName = 'Spinner';

export { Spinner };
