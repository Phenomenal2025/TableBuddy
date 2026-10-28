import {createServer} from 'vite';

const vite = await createServer();
try {
  await vite.listen();
  console.log('Vue development mode / 修改 .vue 文件后页面会自动更新');
  vite.printUrls();
} catch (error) { await vite.close(); throw error; }
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await vite.close();
  process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
