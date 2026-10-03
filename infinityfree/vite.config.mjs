import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root: here,
  publicDir: '../public',
  plugins: [react()],
  resolve: { alias: {
    '@': fileURLToPath(new URL('../', import.meta.url)),
    'next/navigation': `${here}navigation.tsx`,
    'next/link': `${here}link.tsx`
  } },
  build: { outDir: '../dist-infinityfree', emptyOutDir: true, target: 'es2020' }
});
