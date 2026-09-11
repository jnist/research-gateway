import assert from 'node:assert/strict';
import test from 'node:test';
import * as elements from '../../src/features/hec/elements.js';
import { rowsFromCsv, parseSitesFromSortedJson } from '../../src/features/hec/data.js';
import { validateIndexes } from '../../src/features/hec/indexes.js';
import { HecError, errorMessage } from '../../src/features/hec/messages.js';

test('all 118 elements have full English names', () => {
  assert.equal(Object.keys(elements.ENGLISH_ELEMENT_NAMES || {}).length, 118);
  assert.equal(elements.ENGLISH_ELEMENT_NAMES.O, 'Oxygen');
  assert.equal(elements.ENGLISH_ELEMENT_NAMES.Og, 'Oganesson');
  assert.equal(elements.ENGLISH_ELEMENT_NAMES.Pr, 'Praseodymium');
  for (const symbol of Object.keys(elements.ATOMIC_NUMBERS)) {
    assert.match(elements.ENGLISH_ELEMENT_NAMES[symbol], /^[A-Z][a-z]+$/);
  }
});

test('search matches symbols and both languages independently of the display locale', () => {
  assert.equal(typeof elements.elementMatchesQuery, 'function');
  for (const query of ['o', 'OXYGEN', '氧', ' oxygen ']) {
    assert.equal(elements.elementMatchesQuery('O', query), true);
  }
  assert.equal(elements.elementMatchesQuery('O', 'hafnium'), false);
  assert.equal(elements.elementMatchesQuery('Hf', 'HAF'), true);
  assert.equal(elements.elementMatchesQuery('Al', 'aluminum'), true);
  assert.equal(elements.elementMatchesQuery('Cs', 'cesium'), true);
});

test('parser errors retain legacy Chinese messages and structured English details', () => {
  let error;
  try { rowsFromCsv('Sorted Json formula,prototype\nbad,rock-salt'); } catch (caught) { error = caught; }
  assert.match(error.message, /CSV 第 2 行：化学式 JSON 无效/);
  assert.equal(error.messages?.en, 'CSV row 2: Invalid chemical formula JSON');
  assert.equal(error.messages?.zh, error.message);
});

test('site names remain literal error detail in both languages', () => {
  let error;
  try { parseSitesFromSortedJson('{"<img src=x onerror=alert(1)>":null}'); } catch (caught) { error = caught; }
  assert.equal(error.messages?.en, 'Invalid site <img src=x onerror=alert(1)>');
  assert.match(error.message, /位点 <img src=x onerror=alert\(1\)> 无效/);
});

test('index errors carry both languages without depending on document', () => {
  let error;
  try { validateIndexes({}, 1); } catch (caught) { error = caught; }
  assert.match(error.message, /索引文件/);
  assert.equal(error.messages?.en, 'Index file is missing valid cifs, supercells, or titles');
});

test('one retained error can be formatted repeatedly without mutating its detail', () => {
  const error = new HecError('错误：<raw>', 'Error: <raw>');
  assert.equal(errorMessage(error, 'en'), 'Error: <raw>');
  assert.equal(errorMessage(error, 'zh'), '错误：<raw>');
  assert.equal(errorMessage(error, 'en'), 'Error: <raw>');
  assert.equal(error.message, '错误：<raw>');
  assert.equal(errorMessage(new Error('<raw>'), 'en'), '<raw>');
});
