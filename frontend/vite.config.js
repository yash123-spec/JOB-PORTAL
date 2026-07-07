import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing third-party libraries into their own cached
        // chunks. They change far less often than your app code, so returning
        // visitors (and everyone after a redeploy) reuse them from cache
        // instead of re-downloading. Heavy libs (socket.io, moment) also get
        // isolated so they don't bloat the shared bundle.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket': ['socket.io-client'],
          'moment': ['moment'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
