import {defineConfig, loadEnv} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {startLocalService} from './server.mjs';

const root = dirname(fileURLToPath(import.meta.url));

// Both npm run dev and a direct Vite invocation own the same API lifecycle.
function localApi() {
  let backend;
  let closing;
  async function close() {
    if (closing) return closing;
    if (!backend?.server) return;
    const server = backend.server;
    closing = new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
    return closing;
  }
  return {
    name: 'tablebuddy-local-api',
    apply: 'serve',
    async config(_, {mode}) {
      const env = {...loadEnv(mode, root, ''), ...process.env};
      backend = await startLocalService({port: Number(env.PORT ?? 3186), config: {
        apiKey: env.LLM_API_KEY, model: env.LLM_MODEL, apiUrl: env.LLM_API_URL,
        timeoutMs: Number(env.LLM_TIMEOUT_MS) || 12000,
      }, log: console.log});
      return {server: {host: env.HOST || '127.0.0.1', port: 5173,
        proxy: {'/api': {target: backend.url, changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (request, original) => {
              const origin = original.headers.origin;
              if (origin === 'http://' + original.headers.host || origin === 'https://' + original.headers.host) request.setHeader('origin', backend.url);
            });
          },
        }},
      }};
    },
    configureServer(server) {
      server.httpServer?.once('close', () => { void close(); });
      server.httpServer?.once('error', () => { void close(); });
    },
    closeBundle: close,
  };
}

export default defineConfig({
  plugins: [vue(), localApi()],
  envPrefix: 'PEIJU_PUBLIC_',
  build: {outDir: 'dist', target: 'es2020', sourcemap: false},
});
