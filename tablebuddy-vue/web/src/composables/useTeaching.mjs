import {computed, ref, shallowRef} from 'vue';
import {createSession, validSession, transition, viewOf} from '../core.mjs';
import {persistentMessages, stateErrorKey} from '../session-messages.mjs';

export const SESSION_KEY = 'peiju-session-v2';
export const SETUP_LOG_KEY = 'tablebuddy-setup-events-v1';

// The state machine stays independent of Vue; this adapter owns browser storage.
export function useTeaching(language, storage) {
  // State transitions return new objects. shallowRef also keeps structuredClone
  // in the framework-independent state machine from receiving a Vue Proxy.
  const session = shallowRef(null);
  const saved = shallowRef(null);
  const messageKey = ref('');
  const resetToken = ref(0);
  const setupEvents = shallowRef([]);
  const view = computed(() => validSession(session.value) ? viewOf(session.value, language.value) : null);
  try {
    storage ??= globalThis.localStorage;
    const value = JSON.parse(storage.getItem(SESSION_KEY));
    if (validSession(value) && value.status === 'active') saved.value = value;
    const events = JSON.parse(storage.getItem(SETUP_LOG_KEY));
    if (Array.isArray(events)) setupEvents.value = events.filter(e => e?.event === 'question' && e.phase === 'setup' && Number.isFinite(e.at)).slice(-300);
  } catch { messageKey.value = 'readFailed'; }

  function save() {
    try { storage.setItem(SESSION_KEY, JSON.stringify(session.value)); }
    catch { messageKey.value = 'saveFailed'; }
  }
  function start(players, experience) {
    try {
      session.value = createSession(players, experience);
      messageKey.value = 'started';
      save();
      return true;
    } catch (error) { messageKey.value = stateErrorKey(error); return false; }
  }
  function restore() {
    if (!saved.value) return;
    if (!validSession(saved.value)) { messageKey.value = 'sessionInvalid'; return; }
    session.value = saved.value;
    messageKey.value = 'restored';
  }
  function act(name) {
    if (!session.value) {
      if (name === 'question') {
        setupEvents.value = [...setupEvents.value, {event: 'question', phase: 'setup', at: Date.now()}].slice(-300);
        try { storage.setItem(SETUP_LOG_KEY, JSON.stringify(setupEvents.value)); }
        catch { messageKey.value = 'saveFailed'; }
      }
      return;
    }
    try { session.value = transition(session.value, name); save(); }
    catch (error) { messageKey.value = stateErrorKey(error); }
  }
  function languageChanged() {
    if (!persistentMessages.has(messageKey.value)) messageKey.value = 'languageChanged';
  }
  function reset() {
    try { storage.removeItem(SESSION_KEY); storage.removeItem(SETUP_LOG_KEY); }
    catch { messageKey.value = 'clearFailed'; return false; }
    session.value = null;
    saved.value = null;
    setupEvents.value = [];
    resetToken.value++;
    messageKey.value = 'resetDone';
    return true;
  }
  function exportLog() {
    if (!session.value && !setupEvents.value.length) { messageKey.value = 'noLog'; return null; }
    messageKey.value = 'exported';
    return {exportedAt: new Date().toISOString(), language: language.value,
      type: 'teaching-events-not-user-research', setupEvents: setupEvents.value, session: session.value};
  }
  return {session, saved, view, messageKey, resetToken, start, restore, act, reset, exportLog, languageChanged};
}
