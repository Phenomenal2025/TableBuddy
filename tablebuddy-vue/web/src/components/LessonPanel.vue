<script setup>
import {useLocale} from '../composables/useLocale.mjs';
import RuleSources from './RuleSources.vue';
defineProps({view: {type: Object, required: true}, session: {type: Object, required: true}});
const emit = defineEmits(['action']);
const {t} = useLocale();
</script>

<template>
  <section id="lesson" class="panel">
    <div class="section-top">
      <span id="step-number" class="number">{{ String(view.index).padStart(2, '0') }}</span>
      <span>{{ t('lessonLabel') }}</span>
      <span id="progress-text" class="right">{{ view.index }} / {{ view.total }}</span>
    </div>
    <progress id="progress" :value="view.index" :max="view.total" :aria-label="t('lessonLabel')"></progress>
    <h2 id="step-title">{{ view.title }}</h2>
    <p id="explanation" class="lesson-text">{{ view.explanation }}</p>
    <p id="setup-chips" class="muted">{{ session.stepIndex === 1 ? t('chips', {players: session.playerCount, chips: view.chips}) : '' }}</p>
    <div v-show="view.showExample" id="example" class="example">
      <span>{{ t('example') }}</span><p id="example-text">{{ view.example }}</p>
    </div>
    <p v-if="view.paused" id="paused" class="notice">{{ t('paused') }}</p>
    <div class="actions">
      <template v-if="!view.paused">
        <button id="next" class="primary" @click="emit('action', 'next')">{{ t(view.index === view.total ? 'finish' : 'next') }}</button>
        <button id="more" class="secondary" @click="emit('action', 'more')">{{ t('more') }}</button>
      </template>
      <button v-else id="resume" class="primary" @click="emit('action', 'resume')">{{ t('resume') }}</button>
    </div>
    <div v-if="!view.paused" class="minor-actions">
      <button v-if="session.stepIndex > 0" id="back" class="quiet" @click="emit('action', 'back')">{{ t('back') }}</button>
      <button id="handover" class="quiet" @click="emit('action', 'handover')">{{ t('handover') }}</button>
    </div>
    <details id="lesson-sources">
      <summary>{{ t('sources') }}</summary>
      <RuleSources id="source-list" :sources="view.sources" />
    </details>
  </section>
</template>
