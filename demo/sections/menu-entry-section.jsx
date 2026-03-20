import { Section } from '../section';
import { MenuEntry } from '../../components/menu-entry';
import { MobileMenuEntry } from '../../components/menu-entry-mobile';

const dropdownEntries = [
	{ label: 'Documentation', href: '#docs' },
	{ label: 'Downloads', href: '#downloads' },
	{ separator: true },
	{ label: 'Forums', href: '#forums' },
];

export function MenuEntrySection() {
	return (
		<>
			<Section title="MenuEntry (link)">
				<ul className="nav" style={ { listStyle: 'none', display: 'flex', gap: '8px' } }>
					<MenuEntry label="Home" href="#home" />
					<MenuEntry label="About" href="#about" />
				</ul>
			</Section>

			<Section title="MenuEntry (dropdown)">
				<ul className="nav" style={ { listStyle: 'none', display: 'flex', gap: '8px' } }>
					<MenuEntry
						label="Resources"
						dropdown
						entries={ dropdownEntries }
					/>
				</ul>
			</Section>

			<Section title="MobileMenuEntry">
				<ul className="nav" style={ { listStyle: 'none' } }>
					<MobileMenuEntry label="Home" href="#home" />
					<MobileMenuEntry label="About" href="#about" />
					<MobileMenuEntry label="Contact" href="#contact" />
				</ul>
			</Section>
		</>
	);
}
