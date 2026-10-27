<script setup>
import {useLocale} from '../composables/useLocale.mjs';
defineProps({sources: {type: Array, default: () => []}});
const {t} = useLocale();
</script>

<template>
  <div>
    <div v-for="source in sources" :key="source.id" class="source-item">
      <strong>{{ source.id }} · {{ source.title }}</strong>
      <p>{{ source.text }}</p>
      <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ t('sourcePage', {page: source.page}) }}</a>
    </div>
  </div>
</template>
