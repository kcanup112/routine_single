import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow network access
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/departments': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/programmes': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/semesters': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/classes': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/teachers': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/subjects': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/schedules': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/rooms': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/days': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shifts': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/periods': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/teacher_subjects': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/class_routines': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/finance': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // Pre-bundle heavy deps so dev mode doesn't serve 15+ separate MUI chunks
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@emotion/react',
      '@emotion/styled',
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
    ],
  },
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          'mui-data': ['@mui/x-data-grid', '@mui/x-date-pickers'],
          'charts': ['@xyflow/react', '@dagrejs/dagre'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    // Enable source maps for debugging but keep production fast
    sourcemap: false,
  },
})
