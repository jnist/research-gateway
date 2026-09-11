import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  rowsFromCsv, filterRows, rowMatchesSelection, exportRows,
} from '../../src/features/hec/data.js';
import { buildPrettyFormula, escapeHtml, extractDois } from '../../src/features/hec/format.js';
import { assetPath } from '../../src/lib/paths.js';
import { validateIndexes } from '../../src/features/hec/indexes.js';

const csv = readFileSync(new URL('../../public/data/hec/v1.0/dataset.csv', import.meta.url), 'utf8');
const rows = rowsFromCsv(csv);

test('official dataset contains 717 records with stable original indexes', () => {
  assert.equal(rows.length, 717);
  assert.equal(rows[0].id, 1);
  assert.equal(rows[716].id, 717);
  assert.equal(rows[0].data.prototype, 'AlB2');
});

test('empty selection preserves the original empty-result behavior', () => {
  assert.deepEqual(filterRows(rows, []), []);
});

test('all selected elements must coexist at the SAME lattice site', () => {
  assert.equal(rowMatchesSelection(rows[0].sites, ['Hf', 'Ti']), true);
  assert.equal(rowMatchesSelection(rows[0].sites, ['Hf', 'B']), false);
  assert.equal(rowMatchesSelection(rows[0].sites, ['B']), true);
  assert.equal(rowMatchesSelection({ A: new Set(['Ca', 'Cl']) }, ['C']), false);
});

test('preserves X occupancy notation without treating X as an element', () => {
  assert.ok(rows[32].sortedJsonValue.includes('"X"'));
  assert.equal(rows[32].elements.has('X'), false);
  assert.equal(rows[32].elements.has('O'), true);
});

test('rejects invalid CSV schema, malformed quoting, JSON, and site entries', () => {
  for (const invalid of [
    '', 'wrong,header\n1,2', 'Sorted Json formula,prototype\n"unterminated,',
    'Sorted Json formula,prototype\nbad,rock-salt',
    'Sorted Json formula,prototype\nnull,rock-salt',
    'Sorted Json formula,prototype\n{},rock-salt',
    'Sorted Json formula,prototype\n"{""A"":{""<img>"":1}}",rock-salt',
    'Sorted Json formula,prototype\n"{""A"":{""C"":-1}}",rock-salt',
  ]) assert.throws(() => rowsFromCsv(invalid), /CSV|JSON|元素|位点|记录|占比|列/);
});

test('accepts BOM, CRLF and historical header with trailing comma', () => {
  const input = '\uFEFF"Sorted Json formula,",prototype\r\n"{""A"":{""C"":1}}","a,b"\r\n';
  assert.equal(rowsFromCsv(input)[0].data.prototype, 'a,b');
});

test('filtered export includes ALL matches and retains original record IDs', () => {
  const matches = filterRows(rows, ['O']);
  assert.ok(matches.length > 25);
  const exported = exportRows(matches);
  const imported = rowsFromCsv(exported);
  assert.equal(imported.length, matches.length);
  assert.deepEqual(imported.map(row => row.id), matches.map(row => row.id));
  assert.equal(imported[0].sortedJsonValue, matches[0].sortedJsonValue);
});

test('CSV export neutralizes spreadsheet formulas in textual fields', () => {
  const row = { ...rows[0], data: { ...rows[0].data, prototype: '=CMD()' } };
  assert.match(exportRows([row]), /'=CMD\(\)/);
});

test('record IDs from imported exports are validated and unique', () => {
  const exported = exportRows([rows[0], rows[1]]);
  assert.throws(() => rowsFromCsv(exported.replace('\r\n2,', '\r\n1,')), /ID/);
});

test('preserves legacy formula formatting and escapes HTML attributes', () => {
  assert.match(buildPrettyFormula(rows[0].sortedJsonValue, rows[0].data.prototype_formula), /Hf<sub>0.2<\/sub>/);
  assert.match(buildPrettyFormula(rows[0].sortedJsonValue, rows[0].data.prototype_formula), /B<sub>2<\/sub>$/);
  assert.equal(escapeHtml('"<x>&'), '&quot;&lt;x&gt;&amp;');
  assert.deepEqual(extractDois("['https://doi.org/10.123/a', 'https://doi.org/10.123/a']"), ['https://doi.org/10.123/a']);
});

test('joins root, project, and encoded resource paths consistently', () => {
  assert.equal(assetPath('/', 'research/hec/'), '/research/hec/');
  assert.equal(assetPath('/research-gateway/', '/data/hec/v1.0/dataset.csv'), '/research-gateway/data/hec/v1.0/dataset.csv');
});

test('migration matches the original algorithm across real element pairs', () => {
  // The release baseline is deliberately isolated from browser globals.
  const source = readFileSync(new URL('../fixtures/legacy-core.txt', import.meta.url), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context);
  for (const selected of [['C'], ['O'], ['Hf'], ['Hf', 'Ti'], ['C', 'Hf'], ['La', 'O'], ['Ca', 'Cl'], ['Zr', 'Ti', 'Nb']]) {
    const expected = rows.filter(row => context.rowMatchesSelection(row.sites, selected)).map(row => row.id);
    assert.deepEqual(filterRows(rows, selected).map(row => row.id), expected);
  }
});

test('index validation rejects missing fields, traversal and wrong row mappings', () => {
  assert.throws(() => validateIndexes({ cifs: {}, supercells: {} }, 717), /索引/);
  assert.throws(() => validateIndexes({ cifs: { 0: ['../bad.cif'] }, supercells: {}, titles: {} }, 717), /索引/);
  assert.throws(() => validateIndexes({ cifs: { 0: ['row001_AlB2.cif'] }, supercells: {}, titles: {} }, 717), /索引/);
  assert.throws(() => validateIndexes({ cifs: { 999: ['row999_AlB2.cif'] }, supercells: {}, titles: {} }, 717), /索引/);
  assert.throws(() => validateIndexes({ cifs: {}, supercells: {}, titles: { '10.123/a': 12 } }, 717), /索引/);
  assert.doesNotThrow(() => validateIndexes({ cifs: { 0: ['row000_AlB2.cif'] }, supercells: {}, titles: {} }, 717));
});

test('reimport refuses to rewrite an existing version or its checksum', () => {
  const url = new URL('../../public/data/hec/v1.0/manifest.json', import.meta.url);
  const before = readFileSync(url, 'utf8');
  const result = spawnSync(process.execPath, ['scripts/import-release.mjs'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /版本目录已存在/);
  assert.equal(readFileSync(url, 'utf8'), before);
});
