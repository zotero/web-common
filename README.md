[![CI](https://github.com/zotero/web-common/actions/workflows/ci.yml/badge.svg)](https://github.com/zotero/web-common/actions/workflows/ci.yml)

Zotero Web Common
===========

A set of tree-shakeable utilities, hooks and React components used through Zotero web applications.

## Usage
Expected usage is as a git submodule from a tagged version following [semver](https://semver.org/). Indivudual directories (`components/`, `hooks/` and `utils/`) are index allowing direct imports, e.g. `import { Dropdown } from 'web-common/components'`.

## Demo

A demo app showcasing core components is available in the `demo/` directory. To start it:

	npm start

Then open http://localhost:5173/ in the browser.

## Tests

	npm test

This runs [Playwright component tests](https://playwright.dev/docs/test-components). Linting and type checking are also available:

	npm run lint
	npm run typecheck
