import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    ['@nuxtjs/google-fonts', {
        families: {
          Roboto: true,
          Inter: [400, 700],
          'Josefin+Sans': true,
          Lato: [100, 300],
          Raleway: {
            wght: [100, 400],
            ital: [100]
          },
          'Crimson Pro': {
            wght: '200..900',
            ital: '200..700',
          }
        }
    }],
  ],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  build: {
    transpile: ['socket.io-client']
  },
  css: ['/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  ssr: true,
  nitro: {
    experimental: {
      websocket: true
    }
  },
  runtimeConfig: {
    // Server-side environment variables
    jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-key-change-this',
    mongodbUri: process.env.MONGODB_URI,
    
    // Public variables
    public: {
      socketUrl: process.env.SOCKET_URL || '',
      socketPort: process.env.SOCKET_PORT || 'https://socket-server-rix7.onrender.com'
    }
  }
})
