<script setup>
import {ref} from 'vue';
import {useLocale} from '../composables/useLocale.mjs';
defineProps({canRestore: Boolean});
const emit = defineEmits(['start', 'restore']);
const {t} = useLocale();
const players = ref(4);
const experience = ref('mixed');
</script>

<template>
  <section id="setup" class="panel">
    <div class="section-top"><span class="number">01</span><span>{{ t('setupLabel') }}</span></div>
    <h2>No Thanks!</h2>
    <p class="muted">{{ t('edition') }}</p>
    <form id="start-form" @submit.prevent="emit('start', players, experience)">
      <div class="field-grid">
        <label><span>{{ t('players') }}</span>
          <select id="players" v-model.number="players">
            <option v-for="n in [3, 4, 5, 6, 7]" :key="n" :value="n">{{ t('playerOption', {n}) }}</option>
          </select>
        </label>
        <label><span>{{ t('experience') }}</span>
          <select id="experience" v-model="experience">
            <option v-for="value in ['new', 'mixed', 'familiar']" :key="value" :value="value">{{ t(value) }}</option>
          </select>
        </label>
      </div>
      <button class="primary full" type="submit">{{ t('start') }}</button>
    </form>
    <button v-if="canRestore" id="restore" class="quiet full" @click="emit('restore')">{{ t('restore') }}</button>
    <p class="small">{{ t('localNote') }}</p>
  </section>
</template>
