import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/brutalism/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
