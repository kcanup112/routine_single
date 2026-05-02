import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.png', 'kec logo.png', 'building.jpg'],
      manifest: {
        name: 'KEC Routine Scheduler',
        short_name: 'Routine',
        description: 'Routine scheduling system for Kantipur Engineering College',
        theme_color: '#6366f1',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/(api|auth|departments|programmes|semesters|classes|teachers|subjects|schedules|rooms|days|shifts|periods|teacher-subjects|semester|class-routines|finance|notifications)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/(api|auth|departments|programmes|semesters|classes|teachers|subjects|schedules|rooms|days|shifts|periods|notifications)\/.*/],
      },
    }),
  ],
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
      '/notifications': {
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
