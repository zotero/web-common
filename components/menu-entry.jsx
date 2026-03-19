import { Fragment, memo } from 'react';
import cx from 'classnames';
import { DropdownToggle, DropdownMenu, DropdownItem, UncontrolledDropdown } from './dropdown';
import { Icon } from './icon';
import { pick } from '../utils';

const MenuEntry = memo(props => {
	const { label, onKeyDown, dropdown, entries, active, position, truncate } = props;
	const ContainerTag = position === 'right' ? Fragment : 'li';
	const tagProps = position === 'right' ? {} : { className: cx('nav-item', { active }) };

	return dropdown ? (
		<ContainerTag { ...tagProps }>
			<UncontrolledDropdown>
				<DropdownToggle
					className="dropdown-toggle nav-link btn-link"
					onKeyDown={ onKeyDown }
					tabIndex={ -2 }
				>
					{ truncate ? <span className="truncate">{ label }</span> : label }
					<Icon type="16/chevron-9" width="16" height="16" />
				</DropdownToggle>
				<DropdownMenu>
					{ entries.map((entry, ind) => (
						entry.separator ?
							<DropdownItem key={ `divider-${ind}` } divider /> :
							<DropdownItem key={ entry.href } href={ entry.href } tag="a">
								{ entry.label }
							</DropdownItem>
					))}
				</DropdownMenu>
			</UncontrolledDropdown>
		</ContainerTag>
	) : (
		<ContainerTag { ...tagProps }>
			<a className={ cx( props.className, 'nav-link') }
				{ ...pick(props, ['href', 'onKeyDown']) }
				{ ...pick(props, k => k.startsWith('aria-')) }
				tabIndex={ -2 }
			>
				{ truncate ? <span className="truncate">{ label }</span> : label }
			</a>
		</ContainerTag>
	);
});

MenuEntry.displayName = 'MenuEntry';

export { MenuEntry };
