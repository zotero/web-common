import { useState, useCallback } from 'react';
import { Section } from '../section';
import {
	Dropdown, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledDropdown
} from '../../components/dropdown';

export function DropdownSection() {
	const [isOpen, setIsOpen] = useState(false);
	const [lastAction, setLastAction] = useState('(none)');

	const handleToggle = useCallback(() => {
		setIsOpen(o => !o);
	}, []);

	return (
		<>
			<Section title="UncontrolledDropdown">
				<UncontrolledDropdown>
					<DropdownToggle className="btn">
						Open Menu
					</DropdownToggle>
					<DropdownMenu>
						<DropdownItem onClick={ () => setLastAction('New') }>New</DropdownItem>
						<DropdownItem onClick={ () => setLastAction('Open') }>Open</DropdownItem>
						<DropdownItem divider />
						<DropdownItem onClick={ () => setLastAction('Delete') }>Delete</DropdownItem>
					</DropdownMenu>
				</UncontrolledDropdown>
				<p>Last action: { lastAction }</p>
			</Section>

			<Section title="Dropdown with Chevron">
				<UncontrolledDropdown>
					<DropdownToggle className="btn">
						Options <span className="chevron" />
					</DropdownToggle>
					<DropdownMenu>
						<DropdownItem onClick={ () => setLastAction('Cut') }>Cut</DropdownItem>
						<DropdownItem onClick={ () => setLastAction('Copy') }>Copy</DropdownItem>
						<DropdownItem onClick={ () => setLastAction('Paste') }>Paste</DropdownItem>
					</DropdownMenu>
				</UncontrolledDropdown>
			</Section>

			<Section title="Controlled Dropdown">
				<Dropdown isOpen={ isOpen } onToggle={ handleToggle }>
					<DropdownToggle className="btn">
						{ isOpen ? 'Close' : 'Open' }
					</DropdownToggle>
					<DropdownMenu>
						<DropdownItem onClick={ () => console.log('Item A') }>Item A</DropdownItem>
						<DropdownItem onClick={ () => console.log('Item B') }>Item B</DropdownItem>
						<DropdownItem disabled>Disabled Item</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			</Section>
		</>
	);
}
