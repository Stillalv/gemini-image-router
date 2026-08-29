import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit()
  ],
  build: {
    rollupOptions: {
      external: [/^bun:/]
    }
  },
  ssr: {
    external: ['bun:sqlite', 'bun:ffi', 'bun']
  },
  server: {
    port: 8787,
    host: true,
    watch: {
      ignored: ['**/data/**', '**/output/**', '**/.git/**']
    }
  }
});
