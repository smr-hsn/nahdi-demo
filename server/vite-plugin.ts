import type { Plugin } from 'vite'
import { readIdrakConfig, type IdrakEnv } from './idrak-config.ts'
import { handleIdrakProxy } from './idrak-proxy.ts'

export function idrakProxyPlugin(env: IdrakEnv): Plugin {
  const liveConfig = () =>
    readIdrakConfig({
      IDRAK_BASE_URL: process.env.IDRAK_BASE_URL || env.IDRAK_BASE_URL,
      IDRAK_API_KEY: process.env.IDRAK_API_KEY || env.IDRAK_API_KEY,
      IDRAK_AGENT_ID: process.env.IDRAK_AGENT_ID || env.IDRAK_AGENT_ID,
      IDRAK_ALLOWED_ORIGINS: process.env.IDRAK_ALLOWED_ORIGINS || env.IDRAK_ALLOWED_ORIGINS,
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
