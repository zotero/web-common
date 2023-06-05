import React from 'react'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { Select } from '../js/components/select';


describe('Select', () => {
    test('Shows a basic select', async () => {
        render(
            <Select options={ [{ label: 'Foo', value: 'foo' }] } />
        );
    })
});
