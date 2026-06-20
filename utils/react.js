import { Children, Fragment } from 'react';

const mapChildren = (children, mapFunc, out = []) => {
	Children.toArray(children).reduce((out, child) => {
		if(child.type === Fragment) {
			mapChildren(child.props.children, mapFunc, out);
		} else {
			out.push(mapFunc(child));
		}
		return out;
	}, out);
	return out;
}

const flattenChildren = children => mapChildren(children, child => child);

// Assign a single value to a ref, supporting both callback refs and ref objects (and ignoring null).
const setRef = (ref, value) => {
	if (typeof ref === 'function') {
		ref(value);
	} else if (ref) {
		ref.current = value;
	}
};

// Combine several refs into one callback ref, so a node can be shared between e.g. a forwarded ref,
// a local ref and a positioning library's setter.
const mergeRefs = (...refs) => value => {
	refs.forEach(ref => setRef(ref, value));
};

export { flattenChildren, mapChildren, mergeRefs, setRef };
