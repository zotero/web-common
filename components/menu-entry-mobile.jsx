import { memo } from 'react';
import cx from 'classnames';
import { pick } from '../utils';

const MobileMenuEntry = memo(({ className, label, ...rest }) => {
	return (
		<li className="nav-item">
			<a
				className={ cx(className, 'nav-link') }
				{ ...pick(rest, ['href', 'onKeyDown']) }
				tabIndex={ -2 }
			>
				{ label }
			</a>
		</li>
	);
});

MobileMenuEntry.displayName = 'MobileMenuEntry';

export { MobileMenuEntry };
