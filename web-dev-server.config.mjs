import http from 'node:http'
import {fromRollup} from '@web/dev-server-rollup'
import rollupReplace from '@rollup/plugin-replace'
import {esbuildPlugin} from '@web/dev-server-esbuild'

const replace = fromRollup(rollupReplace)

// Backend address for the /api proxy. In docker-compose.dev.yml this is
// http://django:8000; when running outside Docker it defaults to localhost.
const API_HOST = process.env.API_HOST || 'http://localhost:8000'
const apiTarget = new URL(API_HOST)

// Minimal Koa middleware that forwards /api requests to the backend, so the
// frontend can use a relative API URL (__APIHOST__ = '') just like in
// production, where nginx does the same job.
function apiProxy(ctx, next) {
  if (!ctx.path.startsWith('/api')) {
    return next()
  }
  return new Promise(resolve => {
    const headers = {...ctx.req.headers, host: apiTarget.host}
    const proxyReq = http.request(
      {
        hostname: apiTarget.hostname,
        port: apiTarget.port || 80,
        method: ctx.method,
        path: ctx.url,
        headers,
      },
      proxyRes => {
        ctx.status = proxyRes.statusCode
        for (const [name, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined && name !== 'transfer-encoding') {
            ctx.set(name, value)
          }
        }
        ctx.body = proxyRes
        resolve()
      }
    )
    proxyReq.on('error', err => {
      ctx.status = 502
      ctx.body = `API proxy error (${API_HOST}): ${err.message}`
      resolve()
    })
    ctx.req.pipe(proxyReq)
  })
}

export default {
  plugins: [
    esbuildPlugin({ts: true}),
    replace({
      include: [
        'node_modules/@popperjs/**/*.js',
        'node_modules/@popperjs/**/*.ts',
        'node_modules/tippy.js/**/*.ts',
        'node_modules/tippy.js/**/*.js',
      ],
      preventAssignment: true,
      'process.env.NODE_ENV': '"production"',
    }),
  ],
  middleware: [apiProxy],
}
