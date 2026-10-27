<script setup>
import {useLocale} from '../composables/useLocale.mjs';
defineProps({modeKey: {type: String, required: true}});
const {language, t} = useLocale();
</script>

<template>
  <header class="top">
    <a class="brand" href="/">
      <span class="brand-lockup">
        <span class="brand-name">{{ t('brand') }}</span>
        <span v-if="language === 'zh'" class="brand-english">TableBuddy</span>
      </span>
      <span class="brand-tagline">{{ t('tagline') }}</span>
    </a>
    <div class="header-actions">
      <span id="mode" class="pill">{{ t(modeKey) }}</span>
      <label for="language" class="sr-only">{{ t('languageLabel') }}</label>
      <select id="language" v-model="language" :aria-label="t('languageLabel')">
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  </header>
</template>
