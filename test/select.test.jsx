import '@testing-library/jest-dom'
import { getByRole, getAllByRole, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Select, SelectOption, SelectDivider } from '../components';
const options = [
	{ label: 'Foo', value: 'foo' },
	{ label: 'Bar', value: 'bar' },
	{ label: 'Lorem', value: 'lorem' },
	{ label: 'Ipsum', value: 'ipsum' },
];

describe('Select', () => {
    test('Shows a basic select', async () => {
        render(<Select options={ options } />);
		expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
	test('Clicking on the select opens/closes the listbox', async () => {
		const user = userEvent.setup();
		render(<Select options={options} />);
		await user.click(screen.getByRole('combobox'));
		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
		expect(getAllByRole(listbox, 'option')).toHaveLength(options.length);
		await user.click(screen.getByRole('combobox'));
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});
	test('Clicking on an option fires onChange but not onBlur', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const onBlur = jest.fn();
		render(<Select options={options} onChange={onChange} onBlur={ onBlur } />);
		await user.click(screen.getByRole('combobox'));
		await user.click(screen.getByRole('option', { name: 'Bar' }));
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('bar');
		expect(onBlur).not.toHaveBeenCalled();
	});
	test('Clicking on an option that was already selected fires neither onChange nor onBlur', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const onBlur = jest.fn();
		render(<Select options={options} value="bar" onChange={onChange} onBlur={onBlur} />);
		await user.click(screen.getByRole('combobox'));
		const listbox = screen.getByRole('listbox');
		const menuOption = getByRole(listbox, 'option', { name: 'Bar' });
		await user.click(menuOption);
		expect(onChange).not.toHaveBeenCalled();
		expect(onBlur).not.toHaveBeenCalled();
	});
	test('Fires onFocus and onBlur', async () => {
		const user = userEvent.setup();
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		render(
			<div>
				<Select options={options} onFocus={onFocus} onBlur={onBlur} />
				<button>Focus me</button>
			</div>
		);
		await user.click(screen.getByRole('combobox'));
		expect(onFocus).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('combobox')).toHaveFocus();
		await user.keyboard('{tab}');
		expect(onBlur).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button')).toHaveFocus();
		await user.keyboard('{shift>}{tab}{/shift}');
		expect(screen.getByRole('combobox')).toHaveFocus();
		expect(onFocus).toHaveBeenCalledTimes(2);
		expect(onBlur).toHaveBeenCalledTimes(1);
		await user.click(document.body);
		expect(onFocus).toHaveBeenCalledTimes(2);
		expect(onBlur).toHaveBeenCalledTimes(2);
		expect(screen.getByRole('combobox')).not.toHaveFocus();
	});
	test('Should filter options', async () => {
		const user = userEvent.setup();
		render(<Select searchable options={options} />);
		await user.click(screen.getByRole('combobox'));
		await user.type(screen.getByRole('combobox'), 'lorem');
		const listbox = screen.getByRole('listbox');
		expect(getAllByRole(listbox, 'option')).toHaveLength(1);
		expect(getByRole(listbox, 'option', { name: 'Lorem' })).toBeInTheDocument();
	});
	test('If closed, should open as soon as filter is changed', async () => {
		const user = userEvent.setup();
		render(<Select searchable options={options} />);
		await user.click(screen.getByRole('combobox'));
		await user.click(screen.getByRole('combobox'));
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toHaveFocus();
		// filter is empty, input has focus, presing l should open the listbox with the filtered options
		await user.keyboard('l');
		const listbox = screen.getByRole('listbox');
		expect(listbox).toBeInTheDocument();
		expect(getAllByRole(listbox, 'option')).toHaveLength(1);
	});
	test('Should clear filter input on blur, persist otherwise', async () => {
		const user = userEvent.setup();
		render(<Select searchable options={options} />);
		await user.click(screen.getByRole('combobox'));
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		expect(screen.getByRole('textbox')).toHaveValue('');
		expect(screen.getByRole('textbox')).toHaveFocus();
		await user.keyboard('lorem');
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		await user.click(screen.getByRole('combobox'));
		// should persist the value when clicking to close
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		await user.click(screen.getByRole('combobox'));
		// should persist the value when clicking to open again
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		await user.keyboard('{Escape}');
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		await user.keyboard('{tab}');
		await user.keyboard('{shift>}{tab}{/shift}');
		expect(screen.getByRole('textbox')).toHaveValue('');
	});
	test('Should clear filter input on escape', async () => {
		const user = userEvent.setup();
		render(<Select searchable options={options} />);
		await user.click(screen.getByRole('combobox'));
		await user.keyboard('lorem');
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		// first escape closes the listbox
		await user.keyboard('{Escape}');
		expect(screen.getByRole('textbox')).toHaveValue('lorem');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		// second escape clears the input
		await user.keyboard('{Escape}');
		expect(screen.getByRole('textbox')).toHaveValue('');
	});

	test('Should ignore user input if select is disabled', async () => {
		const user = userEvent.setup();
		render(<Select searchable disabled options={options} />);
		await user.click(screen.getByRole('combobox'));
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		await user.type(screen.getByRole('combobox'), 'lorem');
		expect(screen.getByRole('textbox')).toHaveValue('');
	});

	test('Should ignore user input if select is readOnly', async () => {
		const user = userEvent.setup();
		render(<Select searchable readOnly options={options} />);
		await user.click(screen.getByRole('combobox'));
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		await user.type(screen.getByRole('combobox'), 'lorem');
		expect(screen.getByRole('textbox')).toHaveValue('');
	});

	test('Should omit rendering an input field if not marked as searchable', async () => {
		const user = userEvent.setup();
		render(<Select options={options} />);
		await user.click(screen.getByRole('combobox'));
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	test('Should skip over SelectDivider when using keyboard nav', async () => {
		const user = userEvent.setup();
		const onTrigger = jest.fn();
		render(
			<Select value="foo" options={options}>
				<SelectDivider />
				<SelectOption onTrigger={onTrigger} option={ { label: 'Magic', value: '_magic' } } />
			</Select>
		);
		await user.click(screen.getByRole('combobox'));
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		await user.keyboard('{arrowdown}{arrowdown}{arrowdown}{arrowdown}');
		await user.keyboard('{enter}');
		expect(onTrigger).toHaveBeenCalledTimes(1);
	});
});
