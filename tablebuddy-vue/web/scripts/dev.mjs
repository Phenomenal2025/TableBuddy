import {createServer} from 'vite';
import {resolve} from 'node:path';
import {startLocalService} from '../server.mjs';

try { process.loadEnvFile(resolve('.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const config = {apiKey: process.env.LLM_API_KEY, model: process.env.LLM_MODEL,
  apiUrl: process.env.LLM_API_URL, timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 12000};
const backend = await startLocalService({port: Number(process.env.PORT) || 3186, config, log: console.log});
let vite;
try {
  vite = await createServer({server: {
    host: process.env.HOST || '127.0.0.1', port: 5173,
    proxy: {'/api': {target: backend.url, changeOrigin: true,
      configure(proxy) {
        proxy.on('proxyReq', request => request.setHeader('origin', backend.url));
      },
    }},
  }});
  await vite.listen();
  console.log('Vue development mode / 修改 .vue 文件后页面会自动更新');
  vite.printUrls();
} catch (error) {
  if (backend.server) { backend.server.closeAllConnections(); await new Promise(r => backend.server.close(r)); }
  throw error;
}
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await vite.close();
  if (backend.server) { backend.server.closeAllConnections(); await new Promise(r => backend.server.close(r)); }
  process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
