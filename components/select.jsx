import {
	cloneElement, forwardRef, memo, useCallback, useImperativeHandle, useRef, useReducer, useEffect, useMemo, useId
} from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import { flattenChildren, mapChildren } from '../utils/react';
import { pick } from '../utils/immutable';
import { scrollIntoViewIfNeeded } from '../utils/dom';
import { usePrevious } from '../hooks';

const SelectOption = memo(({ option, isSelected, isHighlighted, onMouseDown }) => {
	return (
		<div
			className={cx('select-option', {
				'is-focused': isHighlighted,
				'is-selected': isSelected
			})}
			key={option.value}
			onMouseDown={onMouseDown}
			data-option-value={option.value}
			role="option"
			aria-selected={isSelected}
		>
			{option.label}
		</div>
	)
});

SelectOption.displayName = 'SelectOption';

SelectOption.propTypes = {
	isHighlighted: PropTypes.bool,
	onMouseDown: PropTypes.func,
	option: PropTypes.object,
	isSelected: PropTypes.bool,
};

const SelectDivider = memo(() => <div className="select-option select-divider" />);

SelectDivider.displayName = 'SelectDivider';

const selectReducer = (state, action) => {
	switch(action.type) {
		case 'open':
			return { ...state, isOpen: true, isFocused: true, highlighted: action.value };
		case 'close':
			return { ...state, isOpen: false };
		case 'select':
			return { ...state, isOpen: false, filter: '', filteredOptions: action.options };
		case 'focus':
			return { ...state, isFocused: true };
		case 'blur':
			return { ...state, isFocused: false, isOpen: false, filter: '', filteredOptions: action.options };
		case 'highlight':
			return { ...state, highlighted: action.value, isKeyboard: true};
		case 'highlight-reset':
			return { ...state, highlighted: null };
		case 'filter': {
			const newOptions = action.options.filter(o => o.label.toLowerCase().includes(action.value.toLowerCase()));
			const highlighted = newOptions.length && !newOptions.some(o => o.value === state.highlighted) ? newOptions[0].value : state.highlighted;
			return { ...state, filter: action.value, filteredOptions: newOptions, highlighted, isOpen: true, isKeyboard: true };
		}
		case 'filter-clear':
			return { ...state, filter: '', filteredOptions: action.options };
		case 'mouse':
			return { ...state, isKeyboard: false };
		default:
			return state;
	}
};

const Select = memo(forwardRef((props, ref) => {
	const { children, className, disabled, onBlur, onChange, onFocus, options, readOnly, searchable,
		tabIndex = 0, value, ...rest } = props;

	const fallbackID = useId();
	const id = rest.id || `select-${fallbackID}`;
	const valueLabel = useMemo(() => (options.find(o => o.value === value) || (value !== null ? { label: value } : false) || options[0] || {}).label, [options, value]);
	const valueIndex = useMemo(() => options.findIndex(o => o.value === value), [options, value]);
	const [state, dispatchState] = useReducer(selectReducer, {
		isOpen: false,
		isFocused: false,
		isKeyboard: false,
		highlighted: null,
		filter: '',
		filteredOptions: options,
	});

	const wasOpen = usePrevious(state.isOpen);
	const prevHighlighted = usePrevious(state.highlighted);
	const mergedOptions = useMemo(() => {
		const childrenOptions = flattenChildren(children)
			.filter(c => c.type === SelectOption)
			.map(c => ({ ...c.props.option, component: c }));
		return [...state.filteredOptions, ...childrenOptions];
	}, [children, state.filteredOptions]);

	const selectRef = useRef(null);
	const inputRef = useRef(null);
	const selectMenuRef = useRef(null);

	useImperativeHandle(ref, () => ({
		getElement: () => {
			return selectRef.current;
		},
		focus: () => {
			selectRef.current.focus();
		}
	}));

	const handleFocus = useCallback(ev => {
		if (!disabled && !readOnly) {
			dispatchState({ type: 'focus' });
			if (searchable) {
				selectRef.current.tabIndex = -2;
				inputRef.current?.focus();
			}
			onFocus?.(ev);
		}
	}, [disabled, inputRef, searchable, onFocus, readOnly]);

	const handleBlur = useCallback(ev => {
		selectRef.current.tabIndex = tabIndex;

		if (selectRef?.current?.contains?.(ev.relatedTarget)) {
			ev.preventDefault();
			ev.stopPropagation();
			return;
		}

		if (onBlur) {
			onBlur(ev)
		}

		dispatchState({ type: 'blur', options });
	}, [onBlur, options, tabIndex]);

	const handleClick = useCallback(ev => {
		if (ev.target.closest('.select-option')) {
			return;
		}
		if (state.isOpen) {
			dispatchState({ type: 'close' });
		} else if (!disabled && !readOnly) {
			dispatchState({ type: 'open', value: valueIndex === -1 ? null : options[valueIndex].value });

		}
	}, [disabled, options, readOnly, state.isOpen, valueIndex]);

	// using mouse down to prevent blur firing first
	const handleItemMouseDown = useCallback(ev => {
		selectRef.current.focus();
		dispatchState({ type: 'select', options });
		ev.stopPropagation();
		ev.preventDefault();
		const newValue = ev.currentTarget.dataset.optionValue;
		const targetOption = mergedOptions.find(mo => mo.value === newValue);
		if (targetOption && targetOption.component && targetOption.component.props.onTrigger) {
			targetOption.component.props.onTrigger(ev);
		} else if (!targetOption.component && onChange && newValue !== value) {
			onChange(newValue);
		}
	}, [mergedOptions, onChange, options, value]);

	const getNextIndex = useCallback(direction => {
		const currentIndex = mergedOptions.findIndex(o => o.value === state.highlighted);
		if (currentIndex === -1) {
			return 0;
		}
		let nextIndex = currentIndex + direction;
		if (nextIndex > mergedOptions.length - 1) {
			nextIndex = 0;
		} else if (nextIndex === -1) {
			nextIndex = mergedOptions.length - 1;
		}
		return nextIndex;
	}, [mergedOptions, state.highlighted]);

	const handleKeyDown = useCallback(ev => {
		if (ev.target !== ev.currentTarget) {
			return;
		}

		if (disabled || readOnly) {
			return;
		}

		if (!state.isOpen && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown')) {
			dispatchState({ type: 'open', value: valueIndex === -1 ? null : options[valueIndex].value });
			ev.preventDefault();
		} else if (state.isOpen && ev.key === 'Escape') {
			inputRef.current?.focus();
			dispatchState({ type: 'close' });
			ev.stopPropagation();
		} else if (!state.isOpen && ev.key === 'Escape') {
			dispatchState({ type: 'filter-clear', options });
		} else if (state.isOpen && ev.key === 'ArrowDown') {
			dispatchState({ type: 'highlight', value: mergedOptions[getNextIndex(1)]?.value });
			ev.preventDefault();
		} else if (state.isOpen && ev.key === 'ArrowUp') {
			dispatchState({ type: 'highlight', value: mergedOptions[getNextIndex(-1)]?.value });
			ev.preventDefault();
		} else if (state.isOpen && (ev.key === 'Enter' || ev.key === ' ')) {
			inputRef.current?.focus();
			dispatchState({ type: 'select', options });
			const targetOption = mergedOptions.find(mo => mo.value === state.highlighted);
			if (targetOption && targetOption.component && targetOption.component.props.onTrigger) {
				targetOption.component.props.onTrigger(ev);
			} else if (!targetOption.component && onChange && state.highlighted && state.highlighted !== value) {
				onChange(state.highlighted);
			}
			ev.preventDefault();
		}
	}, [disabled, getNextIndex, mergedOptions, onChange, options, readOnly, state.highlighted, state.isOpen, value, valueIndex]);

	const handleMouseMove = useCallback(() => {
		dispatchState({ type: 'mouse' });
	}, []);

	const handleSearchInput = useCallback(ev => {
		const newFilter = ev.currentTarget.value;
		if (newFilter !== state.filter) {
			dispatchState({ type: 'filter', value: newFilter, options });
		}
	}, [options, state.filter]);

	useEffect(() => {
		if (!state.isOpen && wasOpen) {
			dispatchState({ type: 'highlight-reset' });
		}
		if (!wasOpen && state.isOpen) {
			const highlightedEl = selectRef.current && selectRef.current.querySelector(`[data-option-value="${state.highlighted}"]`);
			if (highlightedEl) {
				scrollIntoViewIfNeeded(highlightedEl, selectMenuRef.current, false);
			}
		}
	}, [state.highlighted, state.isOpen, wasOpen]);

	useEffect(() => {
		if (state.isOpen && state.highlighted !== prevHighlighted) {
			const highlightedEl = selectRef.current && selectRef.current.querySelector(`[data-option-value="${state.highlighted}"]`);
			if (highlightedEl) {
				scrollIntoViewIfNeeded(highlightedEl, selectMenuRef.current, false);
			}
		}
	}, [prevHighlighted, state.highlighted, state.isOpen]);

	return (
		<div
			{...pick(rest, p => p.startsWith('data-') || p.startsWith('aria-'))}
			className={cx('select-component', className, {
				'is-searchable': searchable, 'is-focused': state.isFocused, 'has-value': !!value,
				'is-keyboard': state.isKeyboard, 'is-mouse': !state.isKeyboard, 'is-disabled': disabled, 'is-readonly': readOnly
			})}
			id={id}
			onBlur={handleBlur}
			onClick={handleClick}
			onFocus={handleFocus}
			onKeyDown={searchable ? null : handleKeyDown}
			onMouseMove={handleMouseMove}
			ref={selectRef}
			tabIndex={disabled ? null : tabIndex}
			aria-disabled={disabled}
			aria-readonly={readOnly}
			aria-expanded={state.isOpen}
			role="combobox"
		>
			<div className="select-control">
				<div className="select-multi-value-wrapper">
					<div className="select-value">
						{(!searchable || !state.filter.length) && (
							<span className="select-value-label" >
								{valueLabel}
							</span>
						)}
					</div>
					{searchable && <div className="select-input">
							<input
								aria-controls={`${id}-menu`}
								onChange={handleSearchInput}
								onKeyDown={searchable ? handleKeyDown : null}
								ref={inputRef}
								tabIndex={-2}
								value={state.filter}
							/>
					</div> }
				</div>
				<div className="select-arrow-container">
					<span className="select-arrow" />
				</div>
			</div>
			{(state.isFocused && state.isOpen) && (
				<div className="select-menu-outer">
					<div className="select-menu" role="listbox" ref={selectMenuRef} id={`${id}-menu`}>
						{state.filteredOptions.map(option =>
							<SelectOption
								key={option.value}
								isSelected={value === option.value}
								isHighlighted={state.highlighted === option.value}
								onMouseDown={handleItemMouseDown}
								option={option}

							/>
						)}
						{state.filteredOptions.length === 0 && (
							<div className="select-noresults">
								No results found
							</div>
						)}
						{mapChildren(children, child =>
							child && child.type === SelectOption ?
								cloneElement(child, { isHighlighted: state.highlighted === child.props?.option?.value, isSelected: value === child.props?.option?.value, onMouseDown: handleItemMouseDown }) :
								child
						)}
					</div>
				</div>
			)}
		</div>
	);
}));

Select.displayName = 'Select';

Select.propTypes = {
	children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
	className: PropTypes.string,
	disabled: PropTypes.bool,
	id: PropTypes.string,
	onBlur: PropTypes.func,
	onChange: PropTypes.func,
	onFocus: PropTypes.func,
	options: PropTypes.array,
	readOnly: PropTypes.bool,
	searchable: PropTypes.bool,
	tabIndex: PropTypes.number,
	value: PropTypes.string,
};

export { Select, SelectDivider, SelectOption };
