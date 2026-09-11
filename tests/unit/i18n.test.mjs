import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { initializeLocale, resolveLocale, translate, attrs } from '../../src/lib/i18n.js';

test('locale follows the first browser preference and falls back to English', () => {
  for (const languages of [[], ['en-US'], ['fr-FR', 'zh-CN'], ['ja-JP'], ['zhx']]) {
    assert.equal(resolveLocale(undefined, languages), 'en');
  }
  for (const language of ['zh', 'zh-CN', 'zh-TW', 'zh-HK', 'ZH-cn']) {
    assert.equal(resolveLocale(undefined, [language, 'en-US']), 'zh');
  }
  assert.equal(resolveLocale('en', ['zh-CN']), 'en');
  assert.equal(resolveLocale('zh', ['en-US']), 'zh');
  assert.equal(resolveLocale('invalid', ['zh-CN']), 'zh');
});

test('head bootstrap shares policy and tolerates unavailable storage or languages', () => {
  for (const [languages, saved, denied, expected] of [
    [['zh-CN'], undefined, true, 'zh-CN'],
    [['en-GB'], 'zh', false, 'zh-CN'],
    [['zh-CN'], 'en', false, 'en'],
    [[], undefined, false, 'en'],
    [['de-DE', 'zh-CN'], undefined, false, 'en'],
  ]) {
    const context = vm.createContext({
      document: { documentElement: { lang: 'en' } },
      navigator: { languages },
      localStorage: { getItem() { if (denied) throw new Error('Blocked'); return saved; } },
    });
    vm.runInContext(`(${initializeLocale.toString()})(${resolveLocale.toString()})`, context);
    assert.equal(context.document.documentElement.lang, expected);
  }
});

test('static translation attributes and non-browser rendering default to English', () => {
  assert.equal(translate('中文', 'English'), 'English');
  assert.deepEqual(attrs('aria-label', '搜索', 'Search'), {
    'aria-label': 'Search', 'data-i18n-attrs': 'aria-label',
    'data-zh-aria-label': '搜索', 'data-en-aria-label': 'Search',
  });
});
