import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { useForceUpdate } from '../hooks';

const is2xMQL = typeof(matchMedia) === 'function' ? matchMedia("(min-resolution: 1.5dppx)") : { matches: false };
const isDarkMQL = typeof(matchMedia) === 'function' ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };

export const Icon = memo(props => {
	const { className, color, height, label, role = 'img', type, viewBox, width, usePixelRatio, useThemeColors } = props;
	const style = { color, ...props.style };
	const basename = type.split(/[\\/]/).pop();
	const pixelRatio = usePixelRatio ? is2xMQL.matches ? '@2x' : '@1x' : '';
	const forceUpdate = useForceUpdate();

	let symbol = props.symbol || basename;

	if (useThemeColors) {
		symbol += isDarkMQL.matches ? '-dark' : '-light';
	}

	const svgAttr = {
		className: cx(['icon', `icon-${basename}`, className]),
		role,
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

	if(label) {
		svgAttr['aria-label'] = label;
	}

	useEffect(() => {
		if(usePixelRatio) {
			is2xMQL.addEventListener('change', forceUpdate);
			return () => {
				is2xMQL.removeEventListener('change', forceUpdate);
			};
		}
	}, [forceUpdate, usePixelRatio]);

	useEffect(() => {
		if(useThemeColors) {
			isDarkMQL.addEventListener('change', forceUpdate);
			return () => {
				isDarkMQL.removeEventListener('change', forceUpdate);
			};
		}
	}, [forceUpdate, useThemeColors]);

	return (
		<svg { ...svgAttr } viewBox={ viewBox }>
			<use xlinkHref={`/static/icons/${type}${pixelRatio}.svg#${symbol}`} />
		</svg>
	);
});

Icon.displayName = 'Icon';

Icon.propTypes = {
	className: PropTypes.string,
	color: PropTypes.string,
	height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	label: PropTypes.string,
	role: PropTypes.string,
	style: PropTypes.object,
	symbol: PropTypes.string,
	type: PropTypes.string.isRequired,
	usePixelRatio: PropTypes.bool,
	useThemeColors: PropTypes.bool,
	viewBox: PropTypes.string,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
