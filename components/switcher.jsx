import cx from 'classnames';
import { forwardRef, memo, useCallback, useEffect, useState } from 'react';

import { usePrevious } from '../hooks/use-previous';

const Switcher = memo(forwardRef((props, ref) => {
	const { checked = false, children, className, onToggle, ...rest } = props;
	const [isChecked, setIsChecked] = useState(checked);
	const prevChecked = usePrevious(checked);

	useEffect(() => {
		if (prevChecked !== checked && checked !== isChecked) {
			setIsChecked(checked);
		}
	}, [checked, prevChecked, isChecked]);

	const handleClick = useCallback(() => {
		const next = !isChecked;
		setIsChecked(next);
		onToggle?.(next);
	}, [isChecked, onToggle]);

	return (
		<button
			role="switch"
			aria-checked={ isChecked }
			type="button"
			className={ cx('switcher', className, { checked: isChecked }) }
			onClick={ handleClick }
			ref={ ref }
			{ ...rest }
		>
			<span className="switcher-knob">
				{ children }
			</span>
		</button>
	);
}));

Switcher.displayName = "Switcher";

export { Switcher };
