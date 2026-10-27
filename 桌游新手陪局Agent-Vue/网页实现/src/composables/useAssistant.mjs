import {onScopeDispose, ref, watch} from 'vue';
import {game} from '../game.mjs';

export function useAssistant({language, stepIndex, t, onAnswered}) {
  const asking = ref(false);
  const answer = ref(null);
  const errorText = ref('');
  let requestId = 0;
  let controller = null;

  function clear() {
    requestId++;
    controller?.abort();
    controller = null;
    asking.value = false;
    answer.value = null;
    errorText.value = '';
  }
  watch(language, clear, {flush: 'sync'});
  onScopeDispose(clear);

  async function ask(question) {
    if (asking.value || !question.trim()) return;
    const id = ++requestId;
    const activeController = new AbortController();
    controller = activeController;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; activeController.abort(); }, 16000);
    asking.value = true;
    answer.value = null;
    errorText.value = '';
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept-Language': language.value},
        body: JSON.stringify({gameId: game.id, gameVersion: game.version,
          stepIndex: stepIndex.value, question: question.trim(), language: language.value}),
        signal: activeController.signal,
      });
      const result = await response.json();
      if (id !== requestId) return;
      if (!response.ok) throw new Error(result.error || t('queryFailed'));
      answer.value = result;
      onAnswered();
    } catch (error) {
      if (id !== requestId) return;
      const text = timedOut ? t('timeout') : error instanceof TypeError ? t('network') : error.message;
      errorText.value = `${text}. ${t('retrySuffix')}`;
    } finally {
      clearTimeout(timer);
      if (id === requestId) { asking.value = false; controller = null; }
    }
  }
  return {asking, answer, errorText, ask, clear};
}
