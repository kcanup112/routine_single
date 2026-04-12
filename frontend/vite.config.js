import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow network access
    port: 3000,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/auth': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/departments': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/programmes': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/semesters': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/classes': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/teachers': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/subjects': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/schedules': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/rooms': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/days': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/shifts': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/periods': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/teacher-subjects': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/teacher_subjects': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/semester': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/class-routines': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/class_routines': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/finance': {
        target: API_TARGET,
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
