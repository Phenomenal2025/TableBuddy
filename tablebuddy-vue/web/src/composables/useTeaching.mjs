import {computed, ref, shallowRef} from 'vue';
import {createSession, validSession, transition, viewOf} from '../core.mjs';

export const SESSION_KEY = 'peiju-session-v2';

// The state machine stays independent of Vue; this adapter owns browser storage.
export function useTeaching(language, storage) {
  // State transitions return new objects. shallowRef also keeps structuredClone
  // in the framework-independent state machine from receiving a Vue Proxy.
  const session = shallowRef(null);
  const saved = shallowRef(null);
  const messageKey = ref('');
  const resetToken = ref(0);
  const view = computed(() => session.value ? viewOf(session.value, language.value) : null);
  try {
    storage ??= globalThis.localStorage;
    const value = JSON.parse(storage.getItem(SESSION_KEY));
    if (validSession(value) && value.status === 'active') saved.value = value;
  } catch { messageKey.value = 'readFailed'; }

  function save() {
    try { storage.setItem(SESSION_KEY, JSON.stringify(session.value)); }
    catch { messageKey.value = 'saveFailed'; }
  }
  function start(players, experience) {
    session.value = createSession(players, experience);
    messageKey.value = 'started';
    save();
  }
  function restore() {
    if (!saved.value) return;
    session.value = saved.value;
    messageKey.value = 'restored';
  }
  function act(name) {
    if (!session.value) return;
    session.value = transition(session.value, name);
    save();
  }
  function reset() {
    try { storage.removeItem(SESSION_KEY); }
    catch { messageKey.value = 'clearFailed'; return false; }
    session.value = null;
    saved.value = null;
    resetToken.value++;
    messageKey.value = 'resetDone';
    return true;
  }
  function exportLog() {
    if (!session.value) { messageKey.value = 'noLog'; return null; }
    messageKey.value = 'exported';
    return {exportedAt: new Date().toISOString(), language: language.value,
      type: 'teaching-events-not-user-research', session: session.value};
  }
  return {session, saved, view, messageKey, resetToken, start, restore, act, reset, exportLog};
}
