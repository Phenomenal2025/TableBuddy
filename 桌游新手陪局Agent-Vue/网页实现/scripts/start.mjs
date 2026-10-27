import {access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {spawn} from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const exists = async path => { try { await access(path, constants.F_OK); return true; } catch { return false; } };

async function runNode(args) {
  const child = spawn(process.execPath, args, {cwd: root, stdio: 'inherit', windowsHide: true});
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  if (code !== 0) throw new Error(`Command failed (${code}): ${args[0]}`);
}

try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Please install Node.js 22.12 or newer.');
  if (!await exists(resolve(root, 'node_modules/vite/package.json')) || !await exists(resolve(root, 'node_modules/vue/package.json'))) {
    const bundledNpm = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
    const windowsNpm = resolve(process.env.ProgramFiles || 'C:/Program Files', 'nodejs/node_modules/npm/bin/npm-cli.js');
    const npmCli = await exists(bundledNpm) ? bundledNpm : await exists(windowsNpm) ? windowsNpm : null;
    if (!npmCli) throw new Error('Dependencies missing. Install Node.js with npm, then run npm ci in this folder.');
    console.log('Installing Vue dependencies / 正在安装 Vue 依赖（首次运行需要联网）...');
    await runNode([npmCli, 'ci', '--no-audit', '--no-fund']);
  }
  if (process.argv.includes('--dev')) {
    await import('./dev.mjs');
  } else {
    console.log('Building Vue frontend / 正在编译 Vue 页面...');
    const {build} = await import('vite');
    await build({configFile: resolve(root, 'vite.config.mjs')});
    // The existing launcher owns port selection, browser opening and clean shutdown.
    process.argv = [process.execPath, resolve(root, 'server.mjs'), ...process.argv.slice(2)];
    await import('../server.mjs');
  }
} catch (error) {
  console.error('Startup failed / 启动失败: ' + error.message);
  process.exitCode = 1;
}
