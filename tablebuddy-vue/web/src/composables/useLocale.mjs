import {inject, provide, ref, watch} from 'vue';
import {translate} from '../i18n.mjs';

const localeKey = Symbol('peiju-locale');
const storageKey = 'peiju-language';

export function provideLocale() {
  const language = ref('zh');
  try {
    if (localStorage.getItem(storageKey) === 'en') language.value = 'en';
  } catch { /* A language preference is optional when browser storage is blocked. */ }
  const t = (key, values) => translate(language.value, key, values);
  watch(language, value => {
    document.documentElement.lang = value === 'en' ? 'en' : 'zh-CN';
    document.title = t('pageTitle');
    try { localStorage.setItem(storageKey, value); } catch { /* Keep using this tab. */ }
  }, {immediate: true});
  const locale = {language, t};
  provide(localeKey, locale);
  return locale;
}

export function useLocale() {
  const locale = inject(localeKey);
  if (!locale) throw new Error('Locale must be provided by App.vue');
  return locale;
}
