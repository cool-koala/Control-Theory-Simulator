import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const repositoryBase = process.env.GITHUB_PAGES === 'true' ? '/Control-Theory-Simulator/' : '/';

export default defineConfig({
  base: repositoryBase,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js'
  }
});
