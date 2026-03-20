import { useState, useCallback } from 'react';
import { Section } from '../section';
import { Switcher } from '../../components/switcher';
import { ColorSchemeSwitcher } from '../../components/color-scheme-switcher';

export function SwitcherSection() {
	const [switcherState, setSwitcherState] = useState(false);
	const [mode, setMode] = useState('light');
	const [controlled, setControlled] = useState(false);

	const handleModeToggle = useCallback((newMode) => {
		setMode(newMode);
		document.body.className = newMode === 'dark' ? 'dark' : '';
	}, []);

	return (
		<>
			<Section title="Switcher (uncontrolled)">
				<Switcher onToggle={ (v) => console.log('uncontrolled:', v) } />
			</Section>

			<Section title="Switcher (controlled)">
				<div className="row">
					<Switcher
						checked={ switcherState }
						onToggle={ setSwitcherState }
					/>
					<span className="label">{ switcherState ? 'ON' : 'OFF' }</span>
					<button
						type="button"
						className="ext-toggle"
						onClick={ () => setSwitcherState(s => !s) }
					>
						Toggle from parent
					</button>
				</div>
			</Section>

			<Section title="ColorSchemeSwitcher">
				<div className="row">
					<ColorSchemeSwitcher
						mode={ mode }
						onToggle={ handleModeToggle }
					/>
					<span className="label">Mode: { mode }</span>
				</div>
			</Section>

			<Section title="Prop-driven transition test">
				<p>Click the button -- the switcher should animate, not jump.</p>
				<div className="row">
					<Switcher checked={ controlled } />
					<button
						type="button"
						className="ext-toggle"
						onClick={ () => setControlled(c => !c) }
					>
						Drive from parent (currently { controlled ? 'checked' : 'unchecked' })
					</button>
				</div>
			</Section>
		</>
	);
}
