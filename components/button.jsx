import cx from 'classnames';
import { forwardRef, memo } from 'react';

const Button = memo(forwardRef((props, ref) => {
	const { children, className, icon, type = 'button', ...rest } = props;
		const classNames = cx('btn', className, {
			'btn-icon': icon
		});
		return (
			<button
				type={ type }
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
