import test from 'node:test';
import assert from 'node:assert/strict';
import {ref, effectScope} from 'vue';
import {useTeaching, SESSION_KEY} from '../src/composables/useTeaching.mjs';
import {useAssistant} from '../src/composables/useAssistant.mjs';
import {translate} from '../src/i18n.mjs';

function memoryStorage(initial = null) {
  const values = new Map(initial ? [[SESSION_KEY, JSON.stringify(initial)]] : []);
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)};
}

test('Vue状态可前进、暂停和恢复，不把Proxy交给structuredClone', () => {
  const state = useTeaching(ref('zh'), memoryStorage());
  state.start(6, 'mixed');
  state.act('next');
  assert.equal(state.view.value.chips, 9);
  state.act('more');
  state.act('handover');
  state.act('next');
  assert.equal(state.session.value.stepIndex, 1);
  state.act('resume');
  state.act('next');
  assert.equal(state.session.value.stepIndex, 2);
});

test('Vue适配层恢复旧格式进度，换语言不改变进度', () => {
  const storage = memoryStorage();
  const first = useTeaching(ref('zh'), storage);
  first.start(7, 'new'); first.act('next'); first.act('more');
  const language = ref('en');
  const second = useTeaching(language, storage);
  assert.ok(second.saved.value);
  second.restore();
  assert.equal(second.view.value.title, 'Set up your table');
  assert.equal(second.view.value.showExample, true);
  const before = JSON.stringify(second.session.value);
  language.value = 'zh';
  assert.equal(second.view.value.title, '准备好这一桌');
  assert.equal(JSON.stringify(second.session.value), before);
});

test('浏览器存储读取、写入和清除失败时给出提示并允许教学', () => {
  const blocked = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); }};
  const state = useTeaching(ref('zh'), blocked);
  assert.equal(state.messageKey.value, 'readFailed');
  state.start(4, 'mixed');
  assert.equal(state.messageKey.value, 'saveFailed');
  state.act('next');
  assert.equal(state.session.value.stepIndex, 1);
  assert.equal(state.reset(), false);
  assert.equal(state.messageKey.value, 'clearFailed');
  assert.ok(state.session.value);
});

test('Vue导出保留记录语义，重置清除记录并通知问答取消', () => {
  const storage = memoryStorage();
  const state = useTeaching(ref('en'), storage);
  assert.equal(state.exportLog(), null);
  state.start(4, 'mixed'); state.act('question');
  const log = state.exportLog();
  assert.equal(log.language, 'en');
  assert.equal(log.type, 'teaching-events-not-user-research');
  assert.equal(log.session.logs[0].event, 'question');
  assert.equal(state.reset(), true);
  assert.equal(state.resetToken.value, 1);
  assert.equal(storage.getItem(SESSION_KEY), null);
});

test('Vue问答切换语言取消请求，迟到响应不会覆盖新语言', async () => {
  const original = globalThis.fetch;
  const language = ref('en');
  let resolveResponse, signal, answered = 0;
  globalThis.fetch = async (_, options) => {
    signal = options.signal;
    return new Promise(resolve => { resolveResponse = resolve; });
  };
  const scope = effectScope();
  try {
    const state = scope.run(() => useAssistant({language, stepIndex: ref(0), t: key => translate(language.value, key), onAnswered: () => answered++}));
    const request = state.ask('Can I refuse?');
    assert.equal(state.asking.value, true);
    language.value = 'zh';
    assert.equal(signal.aborted, true);
    assert.equal(state.asking.value, false);
    resolveResponse(new Response(JSON.stringify({text: 'stale', sources: []})));
    await request;
    assert.equal(state.answer.value, null);
    assert.equal(answered, 0);
  } finally { scope.stop(); globalThis.fetch = original; }
});

test('Vue shows localized state errors and keeps warnings through language changes', () => {
  const state = useTeaching(ref('en'), memoryStorage());
  assert.equal(state.start(2, 'new'), false);
  assert.equal(state.messageKey.value, 'invalidPlayers');
  assert.doesNotMatch(translate('en', state.messageKey.value), /[\u3400-\u9fff]/);
  state.languageChanged();
  assert.equal(state.messageKey.value, 'invalidPlayers');
  state.start(4, 'new'); state.act('bad');
  assert.equal(state.messageKey.value, 'unknownEvent');
  state.session.value = {...state.session.value, stepIndex: 1000};
  state.act('next');
  assert.equal(state.messageKey.value, 'sessionInvalid');
  assert.equal(state.view.value, null);
});

test('setup questions persist, export before teaching, and reset with the session', () => {
  const storage = memoryStorage();
  const state = useTeaching(ref('en'), storage);
  state.act('question');
  const before = state.exportLog();
  assert.equal(before.session, null);
  assert.equal(before.setupEvents[0].phase, 'setup');
  const restored = useTeaching(ref('en'), storage);
  restored.start(4, 'new');
  assert.equal(restored.exportLog().setupEvents.length, 1);
  restored.reset();
  assert.equal(restored.exportLog(), null);
});
