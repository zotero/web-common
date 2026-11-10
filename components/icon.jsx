import { memo, forwardRef, useContext, useEffect } from 'react';
import cx from 'classnames';
import { useForceUpdate } from '../hooks';
import { pick } from '../utils';
import { StaticContext } from './static';

const is2xMQL = typeof(matchMedia) === 'function' ? matchMedia("(min-resolution: 1.5dppx)") : { matches: false };
const isDarkMQL = typeof(matchMedia) === 'function' ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };

const addListener = (mql, listener) => {
	if(mql.addEventListener) {
		mql.addEventListener('change', listener);
	} else if(mql.addListener) {
		mql.addListener(listener);
	}
}

const removeListener = (mql, listener) => {
	if(mql.removeEventListener) {
		mql.removeEventListener('change', listener);
	} else if (mql.removeListener) {
		mql.removeListener(listener);
	}
}

export const Icon = memo(forwardRef((props, ref) => {
	const { className, color, colorScheme = null, height, label, role, type, viewBox, width, usePixelRatio, useColorScheme, ...rest } = props;
	const ariaLabel = label || rest['aria-label'];
	const ariaLabelledBy = rest['aria-labelledby'];
	const hasName = !!(ariaLabel || ariaLabelledBy);
	const style = { color, ...props.style };
	const basename = type.split(/[\\/]/).pop();
	const pixelRatio = usePixelRatio ? is2xMQL.matches ? '@2x' : '@1x' : '';
	const forceUpdate = useForceUpdate();
	const staticPrefix = useContext(StaticContext);

	let symbol = props.symbol || basename;

	if (useColorScheme) {
		if (colorScheme) {
			symbol += `-${colorScheme}`;
		} else {
			symbol += isDarkMQL.matches ? '-dark' : '-light';
		}
	}

	const svgAttr = {
		className: cx(['icon', `icon-${basename}`, className]),
		role: role ?? (hasName ? 'img' : null),
		style
	};

	if(width) {
		svgAttr['width'] = parseInt(width, 10);
	}

	if(height) {
		svgAttr['height'] = parseInt(height, 10);
	}

	if(viewBox) {
		svgAttr['viewBox'] = viewBox;
	}

	if(hasName) {
		svgAttr['aria-label'] = ariaLabel;
		svgAttr['aria-labelledby'] = ariaLabelledBy;
	} else {
		svgAttr['aria-hidden'] = true;
	}

	useEffect(() => {
		if(usePixelRatio) {
			addListener(is2xMQL, forceUpdate);
			return () => {
				removeListener(is2xMQL, forceUpdate);
			};
		}
	}, [forceUpdate, usePixelRatio]);

	useEffect(() => {
		if(useColorScheme) {
			addListener(isDarkMQL, forceUpdate);
			return () => {
				removeListener(isDarkMQL, forceUpdate);
			};
		}
	}, [forceUpdate, useColorScheme]);

	return (
		<svg
			ref={ref}
			{ ...svgAttr }
			viewBox={ viewBox }
			{...pick(rest, p => p.startsWith('data-'))}
		>
			<use xlinkHref={`${staticPrefix}/icons/${type}${pixelRatio}.svg#${symbol}`} />
		</svg>
	);
}));

Icon.displayName = 'Icon';
