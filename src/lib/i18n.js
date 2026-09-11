export const LANGUAGE_KEY = 'jnist-language';

export function resolveLocale(saved, languages = []) {
  if (saved === 'en' || saved === 'zh') return saved;
  const preferred = languages.find(language => typeof language === 'string' && language.trim());
  return /^zh(?:-|$)/i.test(preferred || '') ? 'zh' : 'en';
}

export function getLocale() {
  return typeof document !== 'undefined' && document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
}

export function translate(zh, en) {
  return getLocale() === 'zh' ? zh : en;
}

export function applyLocale(locale, persist = false) {
  const language = locale === 'zh' ? 'zh' : 'en';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  if (persist) {
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Storage can be disabled. */ }
  }
  document.querySelectorAll('[data-i18n-attrs]').forEach(node => {
    for (const attribute of node.getAttribute('data-i18n-attrs').split(' ')) {
      const value = node.getAttribute(`data-${language}-${attribute}`);
      if (value !== null) node.setAttribute(attribute, value);
    }
  });
  document.querySelectorAll('[data-i18n-text]').forEach(node => {
    node.textContent = node.getAttribute(`data-${language}`) || '';
  });
  document.querySelectorAll('[data-language-switch]').forEach(node => {
    node.value = language;
    node.disabled = false;
  });
  document.dispatchEvent(new CustomEvent('localechange', { detail: { locale: language } }));
}

// Used in the document head and unit tests so the detection policy cannot drift.
export function initializeLocale(resolve = resolveLocale) {
  let saved;
  try { saved = localStorage.getItem('jnist-language'); } catch { /* Storage can be disabled. */ }
  const locale = resolve(saved, navigator.languages?.length ? navigator.languages : [navigator.language]);
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}

export function attrs(attribute, zh, en) {
  return {
    [attribute]: en,
    'data-i18n-attrs': attribute,
    [`data-zh-${attribute}`]: zh,
    [`data-en-${attribute}`]: en,
  };
}
