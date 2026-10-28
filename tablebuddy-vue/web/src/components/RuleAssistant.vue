<script setup>
import {computed, ref, watch} from 'vue';
import {useLocale} from '../composables/useLocale.mjs';
import {useAssistant} from '../composables/useAssistant.mjs';
import RuleSources from './RuleSources.vue';

const props = defineProps({stepIndex: {type: Number, default: 0}, resetToken: Number});
const emit = defineEmits(['answered']);
const {language, t} = useLocale();
const question = ref('');
const questionInput = ref(null);
const {asking, answer, errorText, ask, clear} = useAssistant({
  language, t, stepIndex: computed(() => props.stepIndex), onAnswered: () => emit('answered'),
});
const answerMode = computed(() => answer.value?.mode === 'live' ? 'modelAnswer' : answer.value?.mode === 'fallback' ? 'fallbackAnswer' : 'evidenceAnswer');
watch(() => props.resetToken, () => {
  clear();
  question.value = '';
  questionInput.value?.setCustomValidity('');
}, {flush: 'sync'});
watch(language, () => questionInput.value?.setCustomValidity(''));
function validateQuestion(event) {
  event.target.setCustomValidity(question.value.trim() ? '' : t('emptyQuestion'));
}
</script>

<template>
  <aside class="side">
    <section class="panel question-panel">
      <div class="section-top"><span class="number">?</span><span>{{ t('questionLabel') }}</span></div>
      <h2>{{ t('questionTitle') }}</h2>
      <form id="question-form" @submit.prevent="ask(question)">
        <label for="question" class="sr-only">{{ t('questionAria') }}</label>
        <textarea id="question" ref="questionInput" v-model="question" maxlength="300" rows="3" :placeholder="t('placeholder')" required @invalid="validateQuestion" @input="$event.target.setCustomValidity('')"></textarea>
        <div class="question-footer">
          <span class="small">{{ t('editionOnly') }}</span>
          <button id="ask" class="primary compact" type="submit" :disabled="asking">{{ t('ask') }}</button>
        </div>
      </form>
      <p id="question-status" role="status" aria-live="polite">{{ asking ? t('searching') : errorText }}</p>
      <div v-if="answer" id="answer">
        <span id="answer-mode" class="answer-tag">{{ t(answerMode) }}</span>
        <p id="answer-text" class="answer-text">{{ answer.text }}</p>
        <RuleSources id="answer-sources" :sources="answer.sources" />
        <p v-if="answer.needsHuman" id="human-note" class="small">{{ t('humanNote') }}</p>
      </div>
    </section>
    <section class="side-note"><span class="dot"></span><div><strong>{{ t('sideTitle') }}</strong><p>{{ t('sideText') }}</p></div></section>
  </aside>
</template>
