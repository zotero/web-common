import cx from 'classnames';
import { forwardRef, memo } from 'react';

const Button = memo(forwardRef((props, ref) => {
	const { children, className, icon, ...rest } = props;
		const classNames = cx('btn', className, {
			'btn-icon': icon
		});
		return (
			<button
				className={ classNames }
				ref={ ref }
				{ ...rest }
			>
				{ children }
			</button>
		);
}));

Button.displayName = "Button";

export { Button };
