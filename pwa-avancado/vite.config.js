import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // Configurações do Manifest (aparência e instalação)
      manifest: {
        name: 'PWA Avancado Demo',
        short_name: 'PWA Demo',
        description: 'Demonstração de PWA com SW, Cache, Push e Sync',
        theme_color: '#34d399',
        display: 'standalone',
        background_color: "#ffffff",
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST', // Onde o Workbox injetará a lista de arquivos para cache
      },
      devOptions: {
        enabled: true, // Habilita PWA em modo de desenvolvimento (opcional, mas útil)
        type: 'module',
      }
    })
  ],
})