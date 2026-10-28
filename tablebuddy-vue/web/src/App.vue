<script setup>
import {onMounted, onUnmounted, ref, watch} from 'vue';
import {game} from './game.mjs';
import {provideLocale} from './composables/useLocale.mjs';
import {useTeaching} from './composables/useTeaching.mjs';
import HeaderBar from './components/HeaderBar.vue';
import SetupPanel from './components/SetupPanel.vue';
import LessonPanel from './components/LessonPanel.vue';
import CompletePanel from './components/CompletePanel.vue';
import RuleAssistant from './components/RuleAssistant.vue';

const {language, t} = provideLocale();
const {session, saved, view, messageKey, resetToken, start, restore, act, reset, exportLog, languageChanged} = useTeaching(language);
const modeKey = ref('connecting');
const statusController = new AbortController();
watch(language, languageChanged);
onMounted(async () => {
  try {
    const response = await fetch('/api/status', {signal: statusController.signal});
    if (!response.ok) throw new Error('Status unavailable');
    const status = await response.json();
    modeKey.value = status.modelConfigured ? 'configured' : 'evidence';
  } catch { modeKey.value = 'disconnected'; }
});
onUnmounted(() => statusController.abort());

function restart() { if (window.confirm(t('confirmReset'))) reset(); }
function downloadLog() {
  const log = exportLog();
  if (!log) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tablebuddy-session.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <HeaderBar :mode-key="modeKey" />
  <main>
    <section class="intro">
      <div class="eyebrow">YOUR FIRST ROUND</div>
      <h1><span>{{ t('hero1') }}</span><br><span>{{ t('hero2') }}</span></h1>
      <p>{{ t('intro') }}</p>
    </section>
    <div class="workspace">
      <SetupPanel v-if="!session" :can-restore="!!saved" @start="start" @restore="restore" />
      <section v-else-if="!view" class="panel" role="alert">
        <p>{{ t('sessionInvalid') }}</p>
        <button class="primary" @click="restart">{{ t('restart') }}</button>
      </section>
      <LessonPanel v-else-if="session.status !== 'completed'" :session="session" :view="view" @action="act" />
      <CompletePanel v-else @restart="restart" />
      <RuleAssistant :step-index="session?.stepIndex ?? 0" :reset-token="resetToken" @answered="act('question')" />
    </div>
    <section class="bottom-tools">
      <button id="export" class="quiet" @click="downloadLog">{{ t('export') }}</button>
      <button id="restart" class="quiet" @click="restart">{{ t('restart') }}</button>
      <a :href="game.source.url" target="_blank" rel="noopener noreferrer">{{ t('originalRules') }}</a>
    </section>
    <p id="message" class="message" role="status" aria-live="polite">{{ messageKey ? t(messageKey) : '' }}</p>
  </main>
  <footer><span>{{ t('footer') }}</span><span>{{ t('footerNote') }}</span></footer>
</template>
