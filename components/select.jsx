import {
	cloneElement, forwardRef, memo, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo,
	useReducer, useRef, useState
} from 'react';
import cx from 'classnames';
import {flattenChildren, mapChildren} from '../utils/react';
import {pick} from '../utils/immutable';
import {clamp} from '../utils/math';
import {scrollIntoViewIfNeeded} from '../utils/dom';
import {usePrevious} from '../hooks';

const PAGE_SIZE = 10;
const TYPEAHEAD_TIMEOUT = 500;
const NO_RESULTS_MESSAGE = 'No results found';

const optionsEqual = (a, b) => (
	a.length === b.length && a.every((o, i) => o.value === b[i].value && o.label === b[i].label)
);

const getOptionId = (selectId, value) => `${selectId}-option-${encodeURIComponent(value)}`;

const isPrintableKey = ev => ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;

const getTextExcluding = (root, excluded) => {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let text = '';
	while (walker.nextNode()) {
		if (!excluded?.contains(walker.currentNode)) {
			text += walker.currentNode.textContent;
		}
	}
	return text.replace(/\s+/g, ' ').trim();
};

const SelectOption = memo(({id, option, isSelected, isHighlighted, onMouseDown}) => {
	return (
		<div
			className={cx('select-option', {
				'is-focused': isHighlighted,
				'is-selected': isSelected
			})}
			id={id}
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

const SelectDivider = memo(() => <div className="select-option select-divider" aria-hidden="true" />);

SelectDivider.displayName = 'SelectDivider';

// `filter` is null unless the user is typing into a searchable select, in which case the input
// shows the filter instead of the selected label.
// `highlighted` is the option Enter selects. In a searchable select it is only exposed through
// aria-activedescendant while `hasListFocus` is set, that is while the user navigates the options;
// otherwise focus stays with the text in the input.
const selectReducer = (state, action) => {
	switch (action.type) {
		case 'open':
			return {
				...state, isOpen: true, isFocused: true, highlighted: action.value, hasListFocus: !!action.hasListFocus,
				isKeyboard: action.isKeyboard ?? state.isKeyboard
			};
		case 'close':
			return {...state, isOpen: false, hasListFocus: false};
		case 'select':
			return {...state, isOpen: false, hasListFocus: false, filter: null, filteredOptions: action.options};
		case 'focus':
			return {...state, isFocused: true};
		case 'blur':
			return {
				...state, isFocused: false, isOpen: false, hasListFocus: false, filter: null,
				filteredOptions: action.options
			};
		case 'highlight':
			return {...state, highlighted: action.value, hasListFocus: true, isKeyboard: true};
		case 'highlight-reset':
			return {...state, highlighted: null};
		case 'leave-list':
			return state.hasListFocus ? {...state, hasListFocus: false} : state;
		case 'filter': {
			const newOptions = action.options.filter(o => o.label.toLowerCase().includes(action.value.toLowerCase()));
			const highlighted = newOptions.length && !newOptions.some(o => o.value === state.highlighted) ? newOptions[0].value : state.highlighted;
			return {
				...state, filter: action.value, filteredOptions: newOptions, highlighted,
				hasListFocus: action.isRefresh ? state.hasListFocus : false, isOpen: true, isKeyboard: true
			};
		}
		case 'filter-clear':
			return {...state, filter: null, filteredOptions: action.options};
		case 'options':
			return {...state, filteredOptions: action.options};
		case 'mouse':
			return {...state, isKeyboard: false};
		default:
			return state;
	}
};

const Select = memo(forwardRef((props, ref) => {
	const {
		children, className, disabled, onBlur, onChange, onFocus, options, readOnly, searchable: searchableProp,
		tabIndex = 0, value, valuePrefix, ...rest
	} = props;
	const searchable = searchableProp && !readOnly;

	const fallbackID = useId();
	const id = rest.id || `select-${fallbackID}`;
	const listboxId = `${id}-menu`;
	const valueLabel = useMemo(() => (options.find(o => o.value === value) || (value !== null ? {label: value} : false) || options[0] || {}).label, [options, value]);
	const valueIndex = useMemo(() => options.findIndex(o => o.value === value), [options, value]);
	const currentValue = valueIndex === -1 ? null : options[valueIndex].value;
	const prevOptions = usePrevious(options);

	const [state, dispatchState] = useReducer(selectReducer, {
		isOpen: false,
		isFocused: false,
		isKeyboard: false,
		highlighted: null,
		hasListFocus: false,
		filter: null,
		filteredOptions: options,
	});

	const wasOpen = usePrevious(state.isOpen);
	const prevHighlighted = usePrevious(state.highlighted);
	const prevFilter = usePrevious(state.filter);
	const prevValueLabel = usePrevious(valueLabel);
	const mergedOptions = useMemo(() => {
		const childrenOptions = flattenChildren(children)
			.filter(c => c.type === SelectOption)
			.map(c => ({...c.props.option, component: c}));
		return [...state.filteredOptions, ...childrenOptions];
	}, [children, state.filteredOptions]);

	const isMenuOpen = state.isFocused && state.isOpen;
	const isFiltering = searchable && state.filter !== null;
	const activeOption = isMenuOpen && (!searchable || state.hasListFocus) ?
		mergedOptions.find(o => o.value === state.highlighted) : null;

	const selectRef = useRef(null);
	const comboboxRef = useRef(null);
	const selectMenuRef = useRef(null);
	const typeahead = useRef({text: '', timeout: null});
	const hasExplicitLabel = !!(rest['aria-label'] || rest['aria-labelledby']);
	const [nativeLabelProps, setNativeLabelProps] = useState(null);

	useImperativeHandle(ref, () => ({
		getElement: () => {
			return selectRef.current;
		},
		focus: () => {
			comboboxRef.current.focus();
		}
	}));

	const handleFocus = useCallback(ev => {
		if (!disabled && !readOnly) {
			dispatchState({type: 'focus'});
			if (searchable && state.filter === null) {
				comboboxRef.current.select();
			}
			onFocus?.(ev);
		}
	}, [disabled, searchable, onFocus, readOnly, state.filter]);

	const handleBlur = useCallback(ev => {
		if (selectRef?.current?.contains?.(ev.relatedTarget)) {
			ev.preventDefault();
			ev.stopPropagation();
			return;
		}

		if (onBlur) {
			onBlur(ev)
		}

		dispatchState({type: 'blur', options});
	}, [onBlur, options]);

	// Keep focus on the combobox when clicking anywhere else within the component
	const handleMouseDown = useCallback(ev => {
		const combobox = comboboxRef.current;
		if (ev.target === combobox && document.activeElement === combobox) {
			return;
		}
		ev.preventDefault();
		combobox?.focus();
	}, []);

	const handleClick = useCallback(ev => {
		if (ev.target.closest('.select-option')) {
			return;
		}
		if (state.isOpen) {
			dispatchState({type: 'close'});
		} else if (!disabled && !readOnly) {
			dispatchState({type: 'open', value: currentValue});
		}
	}, [currentValue, disabled, readOnly, state.isOpen]);

	const triggerOption = useCallback((option, ev) => {
		if (option?.component?.props.onTrigger) {
			option.component.props.onTrigger(ev);
		} else if (option && !option.component && onChange && option.value !== value) {
			onChange(option.value);
		}
	}, [onChange, value]);

	// using mouse down to prevent blur firing first
	const handleItemMouseDown = useCallback(ev => {
		ev.stopPropagation();
		ev.preventDefault();
		if (disabled || readOnly) {
			return;
		}
		comboboxRef.current.focus();
		dispatchState({type: 'select', options});
		const newValue = ev.currentTarget.dataset.optionValue;
		triggerOption(mergedOptions.find(mo => mo.value === newValue), ev);
	}, [disabled, mergedOptions, options, readOnly, triggerOption]);

	const commitHighlighted = useCallback(ev => {
		dispatchState({type: 'select', options});
		triggerOption(mergedOptions.find(mo => mo.value === state.highlighted), ev);
	}, [mergedOptions, options, state.highlighted, triggerOption]);

	const highlightIndex = useCallback(index => {
		const option = mergedOptions[index];
		if (option) {
			dispatchState({type: 'highlight', value: option.value});
		}
	}, [mergedOptions]);

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

	const getPageIndex = useCallback(direction => {
		const currentIndex = mergedOptions.findIndex(o => o.value === state.highlighted);
		if (currentIndex === -1) {
			return 0;
		}
		return clamp(currentIndex + direction * PAGE_SIZE, 0, mergedOptions.length - 1);
	}, [mergedOptions, state.highlighted]);

	// A repeated character cycles through options starting with it, otherwise the typed text is matched
	const findTypeaheadMatch = useCallback((key, fromValue) => {
		const search = typeahead.current;
		clearTimeout(search.timeout);
		search.timeout = setTimeout(() => { search.text = ''; }, TYPEAHEAD_TIMEOUT);
		search.text += key.toLowerCase();

		const isRepeatedChar = [...search.text].every(char => char === search.text[0]);
		const query = isRepeatedChar ? search.text[0] : search.text;
		const fromIndex = mergedOptions.findIndex(o => o.value === fromValue);
		const startIndex = isRepeatedChar ? fromIndex + 1 : Math.max(fromIndex, 0);
		const ordered = [...mergedOptions.slice(startIndex), ...mergedOptions.slice(0, startIndex)];
		return ordered.find(o => String(o.label).toLowerCase().startsWith(query));
	}, [mergedOptions]);

	const handleKeyDown = useCallback(ev => {
		if (disabled || readOnly) {
			return;
		}

		const {key, altKey} = ev;
		const isTypeahead = !searchable && isPrintableKey(ev) && (key !== ' ' || typeahead.current.text !== '');

		if (!state.isOpen) {
			if (isTypeahead) {
				const match = findTypeaheadMatch(key, currentValue);
				dispatchState({type: 'open', value: match ? match.value : currentValue, isKeyboard: true});
				ev.preventDefault();
			} else if (key === 'ArrowDown' || (key === 'ArrowUp' && !altKey) || key === 'Enter' || (key === ' ' && !searchable)) {
				const hasListFocus = (key === 'ArrowDown' || key === 'ArrowUp') && !altKey;
				dispatchState({type: 'open', value: currentValue, isKeyboard: true, hasListFocus});
				ev.preventDefault();
			} else if (!searchable && (key === 'Home' || key === 'End')) {
				const option = key === 'Home' ? mergedOptions[0] : mergedOptions[mergedOptions.length - 1];
				dispatchState({type: 'open', value: option ? option.value : null, isKeyboard: true});
				ev.preventDefault();
			} else if (key === 'Escape' && state.filter !== null) {
				dispatchState({type: 'filter-clear', options});
			}
			return;
		}

		if (isTypeahead) {
			const match = findTypeaheadMatch(key, state.highlighted);
			if (match) {
				dispatchState({type: 'highlight', value: match.value});
			}
			ev.preventDefault();
		} else if (key === 'Escape') {
			dispatchState({type: 'close'});
			ev.stopPropagation();
		} else if (key === 'ArrowDown') {
			if (!altKey) {
				highlightIndex(getNextIndex(1));
			}
			ev.preventDefault();
		} else if (key === 'ArrowUp' && altKey) {
			if (searchable) {
				dispatchState({type: 'close'});
			} else {
				commitHighlighted(ev);
			}
			ev.preventDefault();
		} else if (key === 'ArrowUp') {
			highlightIndex(getNextIndex(-1));
			ev.preventDefault();
		} else if (searchable && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End')) {
			dispatchState({type: 'leave-list'});
		} else if (!searchable && (key === 'Home' || key === 'End')) {
			highlightIndex(key === 'Home' ? 0 : mergedOptions.length - 1);
			ev.preventDefault();
		} else if (key === 'PageDown' || key === 'PageUp') {
			highlightIndex(getPageIndex(key === 'PageDown' ? 1 : -1));
			ev.preventDefault();
		} else if (key === 'Enter' || (key === ' ' && !searchable)) {
			commitHighlighted(ev);
			ev.preventDefault();
		}
	}, [commitHighlighted, currentValue, disabled, findTypeaheadMatch, getNextIndex, getPageIndex, highlightIndex, mergedOptions, options, readOnly, searchable, state.filter, state.highlighted, state.isOpen]);

	const handleMouseMove = useCallback(() => {
		dispatchState({type: 'mouse'});
	}, []);

	const handleSearchInput = useCallback(ev => {
		const newFilter = ev.currentTarget.value;
		if (newFilter !== state.filter) {
			dispatchState({type: 'filter', value: newFilter, options});
		}
	}, [options, state.filter]);

	useEffect(() => {
		if (!state.isOpen && wasOpen) {
			dispatchState({type: 'highlight-reset'});
			clearTimeout(typeahead.current.timeout);
			typeahead.current.text = '';
		}
		if (!wasOpen && state.isOpen) {
			const highlightedEl = document.getElementById(getOptionId(id, state.highlighted));
			if (highlightedEl) {
				scrollIntoViewIfNeeded(highlightedEl, selectMenuRef.current, false);
			}
		}
	}, [id, state.highlighted, state.isOpen, wasOpen]);

	useEffect(() => {
		if (state.isOpen && state.highlighted !== prevHighlighted) {
			const highlightedEl = document.getElementById(getOptionId(id, state.highlighted));
			if (highlightedEl) {
				scrollIntoViewIfNeeded(highlightedEl, selectMenuRef.current, false);
			}
		}
	}, [id, prevHighlighted, state.highlighted, state.isOpen]);

	useEffect(() => {
		if (typeof (prevOptions) !== 'undefined' && !optionsEqual(options, prevOptions)) {
			if (state.filter) {
				dispatchState({type: 'filter', value: state.filter, options, isRefresh: true});
			} else {
				dispatchState({type: 'options', options});
			}
		}
	}, [options, prevOptions, state.filter]);

	// Select the label shown in the input once filtering ends or the value changes, so typing replaces it
	useEffect(() => {
		const input = comboboxRef.current;
		const hasFilterEnded = typeof (prevFilter) === 'string' && state.filter === null;
		if (searchable && state.filter === null && document.activeElement === input && (hasFilterEnded || valueLabel !== prevValueLabel)) {
			input.select();
		}
	}, [prevFilter, prevValueLabel, searchable, state.filter, valueLabel]);

	useEffect(() => {
		const search = typeahead.current;
		return () => clearTimeout(search.timeout);
	}, []);

	// Close the listbox once the select stops being editable. Becoming read-only replaces the input of a
	// searchable select, so focus is moved to the replacement combobox.
	useEffect(() => {
		if (!disabled && !readOnly) {
			return;
		}
		if (state.isOpen) {
			dispatchState({type: 'close'});
		}
		if (state.isFocused && disabled) {
			dispatchState({type: 'blur', options});
		} else if (state.isFocused && !selectRef.current?.contains(document.activeElement)) {
			comboboxRef.current?.focus();
		}
	}, [disabled, options, readOnly, state.isFocused, state.isOpen]);

	// Without an explicit label, name the listbox of a searchable select after the native labels of its input.
	// Labels wrapping the select are read as text, as referencing them would include the options.
	useLayoutEffect(() => {
		if (!isMenuOpen || !searchable || hasExplicitLabel) {
			return;
		}
		const labels = [...(comboboxRef.current?.labels ?? [])];
		if (labels.length && labels.every(label => label.id && !label.contains(selectRef.current))) {
			setNativeLabelProps({'aria-labelledby': labels.map(label => label.id).join(' ')});
		} else if (labels.length) {
			const text = labels.map(label => getTextExcluding(label, selectRef.current)).filter(Boolean).join(' ');
			setNativeLabelProps(text ? {'aria-label': text} : null);
		} else {
			setNativeLabelProps(null);
		}
	}, [hasExplicitLabel, isMenuOpen, searchable]);

	const comboboxProps = {
		...pick(rest, p => p.startsWith('aria-')),
		id,
		ref: comboboxRef,
		role: 'combobox',
		tabIndex: disabled ? null : tabIndex,
		'aria-controls': listboxId,
		'aria-expanded': isMenuOpen,
		'aria-activedescendant': activeOption ? getOptionId(id, activeOption.value) : undefined,
		onKeyDown: handleKeyDown,
	};

	let listboxLabelProps = null;
	if (hasExplicitLabel) {
		listboxLabelProps = pick(rest, ['aria-label', 'aria-labelledby']);
	} else if (searchable) {
		listboxLabelProps = nativeLabelProps;
	}

	const valuePrefixElement = valuePrefix ? (
		<span className="select-value-prefix">
			{valuePrefix}
		</span>
	) : null;

	return (
		<div
			{...pick(rest, p => p.startsWith('data-'))}
			className={cx('select-component', className, {
				'is-searchable': searchable, 'is-focused': state.isFocused, 'has-value': !!value,
				'is-keyboard': state.isKeyboard, 'is-mouse': !state.isKeyboard, 'is-disabled': disabled,
				'is-readonly': readOnly
			})}
			onBlur={handleBlur}
			onClick={handleClick}
			onFocus={handleFocus}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			ref={selectRef}
		>
			{searchable ? (
				<div className="select-control">
					<div className="select-multi-value-wrapper">
						{!isFiltering && valuePrefixElement}
						<div className="select-input">
							<input
								{...comboboxProps}
								aria-autocomplete="list"
								autoComplete="off"
								disabled={disabled}
								onChange={handleSearchInput}
								readOnly={readOnly}
								value={state.filter ?? valueLabel ?? ''}
							/>
						</div>
					</div>
					<div className="select-arrow-container">
						<span className="select-arrow"/>
					</div>
				</div>
			) : (
				<div
					className="select-control"
					{...comboboxProps}
					aria-disabled={disabled}
					aria-readonly={readOnly}
				>
					<div className="select-multi-value-wrapper">
						<div className="select-value">
							{valuePrefixElement}
							<span className="select-value-label">
								{valueLabel}
							</span>
						</div>
					</div>
					<div className="select-arrow-container">
						<span className="select-arrow"/>
					</div>
				</div>
			)}
			<div className="select-menu-outer" hidden={!isMenuOpen}>
				{isMenuOpen && state.filteredOptions.length === 0 && (
					<div className="select-noresults" aria-hidden="true">
						{NO_RESULTS_MESSAGE}
					</div>
				)}
				<div
					{...listboxLabelProps}
					className="select-menu"
					id={listboxId}
					ref={selectMenuRef}
					role="listbox"
				>
					{isMenuOpen && state.filteredOptions.map(option =>
						<SelectOption
							key={option.value}
							id={getOptionId(id, option.value)}
							isSelected={value === option.value}
							isHighlighted={state.highlighted === option.value}
							onMouseDown={handleItemMouseDown}
							option={option}
						/>
					)}
					{isMenuOpen && mapChildren(children, child =>
						child && child.type === SelectOption ?
							cloneElement(child, {
								id: getOptionId(id, child.props?.option?.value),
								isHighlighted: state.highlighted === child.props?.option?.value,
								isSelected: value === child.props?.option?.value, onMouseDown: handleItemMouseDown
							}) :
							child
					)}
				</div>
			</div>
			<div className="select-status" role="status">
				{isMenuOpen && state.filteredOptions.length === 0 ? NO_RESULTS_MESSAGE : ''}
			</div>
		</div>
	);
}));

Select.displayName = 'Select';

export {Select, SelectDivider, SelectOption};
