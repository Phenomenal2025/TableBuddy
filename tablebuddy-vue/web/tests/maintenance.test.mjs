import test from 'node:test';
import assert from 'node:assert/strict';
import {once, EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {game} from '../src/game.mjs';
import {createSession, validSession, transition, viewOf} from '../src/core.mjs';
import {createRateLimiter} from '../src/rate-limit.mjs';
import {openBrowser} from '../src/open-browser.mjs';
import {createApp, APP_VERSION} from '../server.mjs';

test('session validation and setup guidance follow the rules package', () => {
  const before = createSession(3, 'new');
  const min = game.minPlayers, chips = game.startingChips[6], steps = game.steps;
  try {
    game.minPlayers = 4;
    assert.equal(validSession(before), false);
    assert.throws(() => createSession(3, 'new'), {code: 'invalidPlayers'});
    game.startingChips[6] = 8;
    assert.equal(viewOf(createSession(6, 'new')).chips, 8);
    game.steps = [steps[1], steps[0], ...steps.slice(2)];
    assert.equal(viewOf(createSession(4, 'new')).showSetupChips, true);
  } finally { game.minPlayers = min; game.startingChips[6] = chips; game.steps = steps; }
});

test('questions during pauses and after completion are logged without changing progress', () => {
  let session = transition(createSession(4, 'new'), 'handover');
  session = transition(session, 'question');
  assert.equal(session.logs.at(-1).phase, 'paused');
  assert.equal(session.stepIndex, 0);
  session = transition(session, 'resume');
  for (let i = 0; i < game.steps.length; i++) session = transition(session, 'next');
  const completed = transition(session, 'question');
  assert.equal(completed.status, 'completed');
  assert.equal(completed.logs.at(-1).phase, 'completed');
  assert.equal(completed.logs.length, session.logs.length + 1);
  assert.deepEqual(transition(completed, 'next'), completed);
});

test('core exposes stable error codes for localized callers', () => {
  assert.throws(() => createSession(4, 'bad'), {code: 'invalidExperience'});
  assert.throws(() => transition(null, 'next'), {code: 'sessionInvalid'});
  assert.throws(() => transition(createSession(4, 'new'), 'bad'), {code: 'unknownEvent'});
  assert.throws(() => viewOf(null), {code: 'sessionInvalid'});
});

test('rolling rate limit preserves recent requests across a minute boundary', () => {
  let at = 0;
  const limiter = createRateLimiter({limit: 2, now: () => at});
  try {
    assert.equal(limiter.take('one').allowed, true);
    at = 59999;
    assert.equal(limiter.take('one').allowed, true);
    assert.equal(limiter.take('one').allowed, false);
    at = 60000;
    assert.equal(limiter.take('one').allowed, true);
    assert.equal(limiter.take('one').allowed, false);
    assert.equal(limiter.take('two').allowed, true);
    at = 120001; limiter.prune();
    assert.equal(limiter.size, 0);
  } finally { limiter.dispose(); }
});

test('browser opening uses each platform launcher and provides a useful fallback', () => {
  for (const [platform, command] of [['win32', 'rundll32.exe'], ['darwin', 'open'], ['linux', 'xdg-open']]) {
    let called;
    const child = new EventEmitter(); child.unref = () => {};
    const messages = [];
    openBrowser('http://127.0.0.1:3186', {platform, launch: (...args) => { called = args; return child; }, log: text => messages.push(text)});
    assert.equal(called[0], command);
    assert.ok(called[1].includes('http://127.0.0.1:3186'));
    child.emit('error', Error('Unavailable'));
    assert.match(messages[0], /127\.0\.0\.1/);
  }
});

test('HTTP metadata, caching, favicon, origin checks and rolling limits work together', async () => {
  let at = 0;
  const server = createApp({now: () => at});
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const input = {gameId: game.id, gameVersion: game.version, stepIndex: 0, question: '没有筹码还能拒收吗'};
  const ask = headers => fetch(base + '/api/assistant', {method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify(input)});
  try {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const isVue = pkg.name.endsWith('-vue');
    assert.equal(APP_VERSION, pkg.version + (isVue ? '-vue' : ''));
    assert.equal((await (await fetch(base + '/api/status')).json()).version, APP_VERSION);
    const response = await fetch(base);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    const html = await response.text();
    const asset = html.match(/src="([^\"]+\.(?:js|mjs))"/)[1];
    const js = await fetch(base + asset);
    assert.equal(js.headers.get('cache-control'), isVue ? 'public, max-age=31536000, immutable' : 'no-cache');
    for (const icon of ['/favicon.svg', '/favicon.ico']) {
      const response = await fetch(base + icon);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /image\/svg\+xml/);
    }
    assert.equal((await ask({Origin: 'https://other.invalid'})).status, 403);
    assert.equal((await ask({'Sec-Fetch-Site': 'cross-site'})).status, 403);
    assert.equal((await ask({})).status, 200); // Origin-less local CLI clients remain supported.
    at = 59999;
    for (let i = 0; i < 29; i++) assert.equal((await ask({Origin: base})).status, 200);
    assert.equal((await ask({})).status, 429);
    at = 60000;
    assert.equal((await ask({})).status, 200);
    const limited = await ask({});
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
