import { Section } from '../section';
import { Button } from '../../components/button';

export function ButtonSection() {
	return (
		<>
			<Section title="Button (basic)">
				<div className="row">
					<Button onClick={ () => console.log('clicked') }>
						Default Button
					</Button>
					<Button className="btn-primary" onClick={ () => console.log('primary') }>
						Primary
					</Button>
					<Button className="btn-secondary" onClick={ () => console.log('secondary') }>
						Secondary
					</Button>
				</div>
			</Section>

			<Section title="Button (icon)">
				<div className="row">
					<Button icon onClick={ () => console.log('icon btn') }>
						⚙
					</Button>
					<Button icon onClick={ () => console.log('icon btn 2') }>
						✎
					</Button>
				</div>
			</Section>

			<Section title="Button (disabled)">
				<div className="row">
					<Button disabled>Disabled</Button>
					<Button className="btn-primary" disabled>Disabled Primary</Button>
				</div>
			</Section>
		</>
	);
}
