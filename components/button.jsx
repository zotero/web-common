import cx from 'classnames';
import PropTypes from 'prop-types';
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

Button.propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	icon: PropTypes.bool
};

export { Button };
