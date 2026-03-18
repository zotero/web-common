import { memo } from 'react';
import { Icon } from './icon';

export const Spinner = memo(props => (
	<Icon {...props} role="progressbar" type="16/spin" width="16" height="16" />
));

Spinner.displayName = 'Spinner';
