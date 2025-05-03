import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
      socketPort: process.env.SOCKET_PORT || 3001
    }
  }
})
