import globals from "globals";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const sourceFiles = [
	"cite/**/*.{js,jsx,mjs}",
	"components/**/*.{js,jsx,mjs}",
	"hooks/**/*.{js,jsx,mjs}",
	"utils/**/*.{js,jsx,mjs}",
	"zotero/**/*.{js,jsx,mjs}",
	"test/**/*.{js,jsx,mjs}",
];

export default [
	// Only traverse source and test directories
	{ignores: ["*.config.*", "icons/**", "modules/**", "playwright/**", "playwright-report/**", "scss/**"]},

	// ESLint core recommended rules
	{...js.configs.recommended, files: sourceFiles},

	// Project rules and plugin configs
	{
		files: sourceFiles,

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			ecmaVersion: 14,
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: {jsx: true},
			},
		},

		settings: {
			react: {version: "detect"},
		},

		plugins: {
			react: reactPlugin,
			"react-hooks": reactHooks,
		},

		rules: {
			// React recommended + JSX runtime presets
			...(reactPlugin.configs?.recommended?.rules ?? {}),
			...(reactPlugin.configs?.["jsx-runtime"]?.rules ?? {}),

			// Prop types validation handled by TypeScript definitions
			"react/prop-types": "off",

			// React Hooks recommended
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
];
