import {spawn} from 'node:child_process';

export function openBrowser(url, {platform = process.platform, launch = spawn, log = console.log} = {}) {
  const commands = {
    win32: ['rundll32.exe', ['url.dll,FileProtocolHandler', url]],
    darwin: ['open', [url]],
    linux: ['xdg-open', [url]],
  };
  const command = commands[platform];
  const hint = () => log('Open this address in your browser / 请在浏览器打开: ' + url);
  if (!command) { hint(); return; }
  try {
    const child = launch(command[0], command[1], {stdio: 'ignore', detached: true, windowsHide: true});
    child.once('error', hint);
    child.once('exit', code => { if (code) hint(); });
    child.unref();
  } catch { hint(); }
}
