import { useState, useCallback } from 'react';
import { Section } from '../section';
import {
	Popover, PopoverTrigger, PopoverDialog, PopoverHeader, PopoverBody, UncontrolledPopover
} from '../../components/popover';

export function PopoverSection() {
	const [isOpen, setIsOpen] = useState(false);
	const [identifier, setIdentifier] = useState('');

	const handleToggle = useCallback(() => {
		setIsOpen(o => !o);
	}, []);

	return (
		<>
			<Section title="UncontrolledPopover (header + body)">
				<UncontrolledPopover placement="bottom-start">
					<PopoverTrigger className="btn">
						Add by identifier
					</PopoverTrigger>
					<PopoverDialog aria-label="Add by identifier">
						<PopoverHeader>
							<label htmlFor="demo-identifier">
								Enter a URL, ISBN, DOI, PMID, arXiv ID, or ADS Bibcode:
							</label>
						</PopoverHeader>
						<PopoverBody>
							<input
								id="demo-identifier"
								type="text"
								placeholder="e.g. 10.1000/xyz"
								value={ identifier }
								onChange={ ev => setIdentifier(ev.target.value) }
							/>
						</PopoverBody>
					</PopoverDialog>
				</UncontrolledPopover>
			</Section>

			<Section title="Controlled Popover">
				<Popover isOpen={ isOpen } onToggle={ handleToggle } placement="bottom-start">
					<PopoverTrigger className="btn">
						{ isOpen ? 'Close' : 'Open' } popover
					</PopoverTrigger>
					<PopoverDialog aria-label="Example popover">
						<PopoverBody>
							<p>This popover is fully controlled by the parent component.</p>
						</PopoverBody>
					</PopoverDialog>
				</Popover>
			</Section>

			<Section title="Focus trap + shift (no arrow)">
				<UncontrolledPopover placement="bottom" shift={ { padding: 8 } } trapFocus arrow={ false }>
					<PopoverTrigger className="btn">
						Citation options
					</PopoverTrigger>
					<PopoverDialog aria-label="Citation options">
						<PopoverBody>
							<div className="row">
								<input type="text" aria-label="Prefix" placeholder="Prefix" />
								<input type="text" aria-label="Suffix" placeholder="Suffix" />
								<button className="btn">Done</button>
							</div>
						</PopoverBody>
					</PopoverDialog>
				</UncontrolledPopover>
			</Section>
		</>
	);
}
