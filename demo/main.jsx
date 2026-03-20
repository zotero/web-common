import { createRoot } from 'react-dom/client';

import { SwitcherSection } from './sections/switcher-section';
import { ButtonSection } from './sections/button-section';
import { DropdownSection } from './sections/dropdown-section';
import { SelectSection } from './sections/select-section';
import { TabsSection } from './sections/tabs-section';
import { MenuEntrySection } from './sections/menu-entry-section';
import './main.scss';

function App() {
	return (
		<div className="demo-page">
			<h1>Web Common – Component Demo</h1>
			<p className="note">
				<strong>Note:</strong> Icon, Spinner, and Static are not demoed here.
				Icon and Spinner require SVG sprite files served at a specific path,
				and Static is a context provider with no visual output.
			</p>
			<SwitcherSection />
			<ButtonSection />
			<DropdownSection />
			<SelectSection />
			<TabsSection />
			<MenuEntrySection />
		</div>
	);
}

createRoot(document.getElementById('root')).render(<App />);
