import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/submit' && req.method === 'POST') {
              let raw = ''
              req.on('data', (chunk) => {
                raw += chunk
              })
              req.on('end', async () => {
                try {
                  const { default: handler } = await server.ssrLoadModule('./api/submit.js')
                  const mockRes = {
                    setHeader: (k, v) => res.setHeader(k, v),
                    status: (code) => {
                      res.statusCode = code
                      return mockRes
                    },
                    json: (data) => {
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify(data))
                    },
                  }
                  await handler({ ...req, body: raw }, mockRes)
                } catch (err) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
              return
            }
            next()
          })
        },
      },
    ],
  }
})

