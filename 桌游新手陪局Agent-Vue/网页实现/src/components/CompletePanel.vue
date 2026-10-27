<script setup>
import {useLocale} from '../composables/useLocale.mjs';
const emit = defineEmits(['restart']);
const {t} = useLocale();
</script>

<template>
  <section id="complete" class="panel">
    <div class="eyebrow">READY TO PLAY</div>
    <h2>{{ t('completeTitle') }}</h2>
    <p class="lesson-text">{{ t('completeText') }}</p>
    <p class="small">{{ t('completeNote') }}</p>
    <button id="restart-complete" class="secondary full" @click="emit('restart')">{{ t('restartComplete') }}</button>
  </section>
</template>
