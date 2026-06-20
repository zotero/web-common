import { useState } from 'react';
import { Section } from '../section';
import { ProgressRing } from '../../components/progress-ring';

export function ProgressRingSection() {
	const [value, setValue] = useState(0.4);

	return (
		<>
			<Section title="ProgressRing (default ~16px, and custom radii)">
				<div className="row">
					<ProgressRing value={ value } />
					<ProgressRing value={ value } radius={ 12 } strokeWidth={ 3 } />
					<ProgressRing value={ value } radius={ 24 } strokeWidth={ 4 } />
					<span className="label">{ Math.round(value * 100) }%</span>
				</div>
			</Section>

			<Section title="Drive value (should animate, not jump)">
				<div className="row">
					<ProgressRing value={ value } radius={ 24 } strokeWidth={ 4 } />
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={ value }
						onChange={ (ev) => setValue(parseFloat(ev.target.value)) }
					/>
				</div>
			</Section>

			<Section title="Edge values">
				<div className="row">
					<ProgressRing value={ 0 } radius={ 12 } strokeWidth={ 3 } />
					<span className="label">0 (empty)</span>
				</div>
				<div className="row">
					<ProgressRing value={ 1 } radius={ 12 } strokeWidth={ 3 } />
					<span className="label">1 (full)</span>
				</div>
			</Section>
		</>
	);
}
