import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = resolve(import.meta.dirname, '..');

export default defineConfig({
	plugins: [react()],
	root: import.meta.dirname,
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [resolve(root, 'scss')],
			},
		},
	},
});
