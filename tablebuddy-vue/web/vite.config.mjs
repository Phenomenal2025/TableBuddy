import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // The API server never receives a browser-side copy of .env secrets.
  envPrefix: 'PEIJU_PUBLIC_',
  build: {outDir: 'dist', target: 'es2020', sourcemap: false},
});
