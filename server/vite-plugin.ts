import type { Plugin } from 'vite'
import { readIdrakConfig, type IdrakEnv } from './idrak-config.ts'
import { handleIdrakProxy } from './idrak-proxy.ts'

export function idrakProxyPlugin(env: IdrakEnv): Plugin {
  const liveConfig = () =>
    readIdrakConfig({
      IDRAK_BASE_URL: process.env.IDRAK_BASE_URL || env.IDRAK_BASE_URL,
      IDRAK_API_KEY: process.env.IDRAK_API_KEY || env.IDRAK_API_KEY,
      IDRAK_CHAT_API_KEY: process.env.IDRAK_CHAT_API_KEY || env.IDRAK_CHAT_API_KEY,
      IDRAK_ALLOWED_ORIGINS: process.env.IDRAK_ALLOWED_ORIGINS || env.IDRAK_ALLOWED_ORIGINS,
      REALTIME_TOKEN_API_KEY:
        process.env.REALTIME_TOKEN_API_KEY || env.REALTIME_TOKEN_API_KEY,
      VOICE_SERVER_API_KEY: process.env.VOICE_SERVER_API_KEY || env.VOICE_SERVER_API_KEY,
      VOICE_TOKEN_BASE_URL: process.env.VOICE_TOKEN_BASE_URL || env.VOICE_TOKEN_BASE_URL,
      VOICE_SERVER_BASE_URL: process.env.VOICE_SERVER_BASE_URL || env.VOICE_SERVER_BASE_URL,
    })

  return {
    name: 'idrak-secure-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleIdrakProxy(req, res, liveConfig())
          .then((handled) => {
            if (!handled) next()
          })
          .catch(() => next())
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleIdrakProxy(req, res, liveConfig())
          .then((handled) => {
            if (!handled) next()
          })
          .catch(() => next())
      })
    },
  }
}
