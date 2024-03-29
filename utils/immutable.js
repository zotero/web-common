const omit = (object, deleteKeys) => {
	if(typeof(deleteKeys) !== 'function') {
		if(!Array.isArray(deleteKeys)) {
			deleteKeys = [deleteKeys];
		}
		deleteKeys = deleteKeys.map(dk => typeof(dk) !== 'string' ? dk.toString() : dk);
	}

	return Object.entries(object)
		.reduce((aggr, [key, value]) => {
			if(typeof (deleteKeys) === 'function') {
				if(!deleteKeys(key, value)) { aggr[key] = value; }
			} else if(!deleteKeys.includes(key)) {
				aggr[key] = value;
			}
			return aggr;
	}, {});
}

const pick = (object, pickKeys) => {
	if(typeof(pickKeys) === 'function') {
		return Object.entries(object)
			.reduce((aggr, [key, value]) => {
				if(pickKeys(key)) { aggr[key] = value; }
				return aggr;
		}, {});
	}
	if(!Array.isArray(pickKeys)) {
		pickKeys = [pickKeys];
	}

	return Object.entries(object)
		.reduce((aggr, [key, value]) => {
			if(pickKeys.includes(key)) { aggr[key] = value; }
			return aggr;
	}, {});
}

const mapObject = (object, mappingFunc) => Object.fromEntries(
	Object.entries(object).map(([k, v]) => mappingFunc(k, v))
);

export { mapObject, omit, pick };
