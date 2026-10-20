import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Your original Tailwind import
import { VitePWA } from 'vite-plugin-pwa' // Add this at the top

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // This is what makes your CSS work!
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SpendWise Financial Tracker',
        short_name: 'SpendWise',
        description: 'Track your expenses and manage your budget on the go.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})