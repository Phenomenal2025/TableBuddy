import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import http from 'node:http';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const owned = new Set();
const checks = [];
function launch(args, port, pattern) {
  const child = spawn(process.execPath, args, {cwd: root, windowsHide: true,
    env: {...process.env, PORT: String(port), HOST: '127.0.0.1', LLM_API_KEY: '', LLM_MODEL: ''},
    stdio: ['ignore', 'pipe', 'pipe']});
  owned.add(child);
  let output = '';
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Startup timed out: ' + output)), 20000);
    const read = chunk => {
      output += chunk.toString();
      const match = output.replace(/\x1b\[[0-9;]*m/g, '').match(pattern);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Exited ${code}: ${output}`)); });
  });
  return {child, ready};
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const closed = once(child, 'exit'); child.kill('SIGTERM'); await closed; owned.delete(child);
}

// Simulate an older service from a different folder without touching the user's
// original project, running server, environment configuration or browser data.
const original = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({app: 'peiju-onboarding', instance: 'different-folder', version: '0.3.0'}));
});
original.listen(0, '127.0.0.1'); await once(original, 'listening');
try {
  const port = original.address().port;
  const production = launch(['scripts/start.mjs'], port, /Local: (http:\/\/127\.0\.0\.1:\d+)/);
  const productionUrl = await production.ready;
  assert.notEqual(new URL(productionUrl).port, String(port));
  assert.equal(original.listening, true);
  checks.push('Vue启动器自动避让模拟的异目录旧版服务端口');
  const status = await (await fetch(productionUrl + '/api/status')).json();
  assert.equal(status.version, '0.4.0-vue');
  const html = await (await fetch(productionUrl)).text();
  assert.match(html, /\/assets\/index-[^" ]+\.js/);
  checks.push('启动入口实际完成Vue编译并提供新版页面');
  const reuse = launch(['scripts/start.mjs'], port, /Local: (http:\/\/127\.0\.0\.1:\d+)/);
  assert.equal(await reuse.ready, productionUrl);
  if (reuse.child.exitCode === null) await once(reuse.child, 'exit');
  owned.delete(reuse.child);
  checks.push('再次启动复用Vue副本服务，原版服务不受影响');
  await stop(production.child);
  await assert.rejects(fetch(productionUrl, {signal: AbortSignal.timeout(1000)}));
  checks.push('停止生产服务后端口不再提供网页');
  const development = launch(['scripts/start.mjs', '--dev'], port, /Local:\s+(http:\/\/127\.0\.0\.1:\d+\/?)/);
  const devUrl = await development.ready;
  assert.equal((await fetch(devUrl + 'src/App.vue')).status, 200);
  const devStatus = await (await fetch(devUrl + 'api/status')).json();
  assert.equal(devStatus.version, '0.4.0-vue');
  const response = await fetch(devUrl + 'api/assistant', {method: 'POST',
    headers: {'Content-Type': 'application/json', Origin: devUrl.replace(/\/$/, '')},
    body: JSON.stringify({gameId: 'no-thanks-base', gameVersion: 'amigo-2024-base-v1', stepIndex: 0, question: '没有筹码还能拒收吗', language: 'zh'})});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mode, 'evidence');
  checks.push('开发服务器编译.vue且通过同源代理完成规则查询');
  await stop(development.child);
  await assert.rejects(fetch(devUrl, {signal: AbortSignal.timeout(1000)}));
  checks.push('停止开发服务后不再提供页面');
  await writeFile(resolve(root, '../制作与排版资料/Vue重构检查/启动检查.json'), JSON.stringify({date: '2026-10-27', checks}, null, 2));
  console.log(JSON.stringify({startupChecks: checks.length}));
} finally {
  for (const child of owned) await stop(child);
  original.closeAllConnections(); await new Promise(resolve => original.close(resolve));
}
