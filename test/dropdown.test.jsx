import React from 'react'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from '../js/components/dropdown';


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
});
