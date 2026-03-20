import { useState } from 'react';
import { Section } from '../section';
import { Select, SelectDivider } from '../../components/select';

const fruitOptions = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'cherry', label: 'Cherry' },
	{ value: 'date', label: 'Date' },
	{ value: 'elderberry', label: 'Elderberry' },
];

const colorOptions = [
	{ value: 'red', label: 'Red' },
	{ value: 'green', label: 'Green' },
	{ value: 'blue', label: 'Blue' },
	{ value: 'yellow', label: 'Yellow' },
	{ value: 'purple', label: 'Purple' },
	{ value: 'orange', label: 'Orange' },
];

export function SelectSection() {
	const [fruit, setFruit] = useState('apple');
	const [color, setColor] = useState('red');

	return (
		<>
			<Section title="Select">
				<Select
					options={ fruitOptions }
					value={ fruit }
					onChange={ setFruit }
				/>
				<p>Selected: { fruit }</p>
			</Section>

			<Section title="Select (searchable)">
				<Select
					searchable
					options={ colorOptions }
					value={ color }
					onChange={ setColor }
				/>
				<p>Selected: { color }</p>
			</Section>

			<Section title="Select (disabled)">
				<Select
					disabled
					options={ fruitOptions }
					value="banana"
				/>
			</Section>
		</>
	);
}
