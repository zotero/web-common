import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from '../components';


describe('Dropdown', () => {
    test('Shows a basic dropdown', async () => {
        render(
            <Dropdown>
                <DropdownToggle></DropdownToggle>
                <DropdownMenu>
                    <DropdownItem></DropdownItem>
                    <DropdownItem></DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    })

	test('Not trigger onClick if dropdown item is disabled', async () => {
		const onClick = jest.fn();
		const { getByText } = render(
			<Dropdown>
				<DropdownToggle></DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={onClick} disabled>Disabled</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		);

		getByText('Disabled').click();
		expect(onClick).not.toHaveBeenCalled();
	});
});
