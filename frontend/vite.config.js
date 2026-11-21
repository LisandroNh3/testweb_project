import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pre-empaqueta las dependencias al arrancar para evitar recargas con versiones mezcladas de React.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'axios'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
