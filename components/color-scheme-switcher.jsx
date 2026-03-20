import cx from 'classnames';
import { forwardRef, memo, useCallback } from 'react';

import { Switcher } from './switcher';

const SunIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
		<circle cx="6" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
		<g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
			<line x1="6" y1="0.5" x2="6" y2="1.5"/>
			<line x1="6" y1="10.5" x2="6" y2="11.5"/>
			<line x1="0.5" y1="6" x2="1.5" y2="6"/>
			<line x1="10.5" y1="6" x2="11.5" y2="6"/>
			<line x1="2.11" y1="2.11" x2="2.82" y2="2.82"/>
			<line x1="9.18" y1="9.18" x2="9.89" y2="9.89"/>
			<line x1="2.11" y1="9.89" x2="2.82" y2="9.18"/>
			<line x1="9.18" y1="2.82" x2="9.89" y2="2.11"/>
		</g>
	</svg>
);

const CrescentIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
		<path d="M8.5 1.2A5 5 0 1 0 9.8 9a4 4 0 0 1-1.3-7.8z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
	</svg>
);

const ColorSchemeSwitcher = memo(forwardRef((props, ref) => {
	const {
		className,
		darkIcon = <CrescentIcon />,
		lightIcon = <SunIcon />,
		mode = 'light',
		onToggle,
		...rest
	} = props;

	const handleToggle = useCallback((checked) => {
		onToggle?.(checked ? 'dark' : 'light');
	}, [onToggle]);

	return (
		<Switcher
			checked={ mode === 'dark' }
			onToggle={ handleToggle }
			className={ cx('color-scheme-switcher', className) }
			ref={ ref }
			{ ...rest }
		>
			<span className="switcher-icon switcher-icon-light">{ lightIcon }</span>
			<span className="switcher-icon switcher-icon-dark">{ darkIcon }</span>
		</Switcher>
	);
}));

ColorSchemeSwitcher.displayName = "ColorSchemeSwitcher";

export { ColorSchemeSwitcher };
