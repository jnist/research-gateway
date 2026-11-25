import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  rowsFromCsv, filterRows, sortRowsByEntropy, rowMatchesSelection, exportRows,
} from '../../src/features/hec/data.js';
import { buildPrettyFormula, escapeHtml, extractDois } from '../../src/features/hec/format.js';
import { configurationalEntropyFromSortedJson, formatConfigurationalEntropy } from '../../src/features/hec/entropy.js';
import { materialTypeFromSortedJson } from '../../src/features/hec/material-type.js';
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

test('material_type matches anion-site derivation for every official row', () => {
  const counts = {};
  for (const row of rows) {
    const expected = materialTypeFromSortedJson(row.sortedJsonValue);
    assert.ok(expected, `row ${row.id} must resolve a material type`);
    assert.equal(row.data.material_type, expected, `row ${row.id}`);
    counts[expected] = (counts[expected] || 0) + 1;
  }
  assert.deepEqual(counts, {
    oxide: 445,
    carbide: 57,
    silicate: 44,
    boride: 39,
    telluride: 23,
    chalcogenide: 17,
    nitride: 16,
    carbonitride: 15,
    sulfide: 12,
    silicide: 10,
    fluoride: 9,
    selenide: 5,
    antimonide: 5,
    phosphate: 4,
    oxyfluoride: 4,
    thiophosphate: 4,
    chloride: 3,
    stannate: 2,
    carbosilicate: 1,
    stannide: 1,
    iodide: 1,
  });
});

test('configurational_entropy matches max-site mixing entropy for every official row', () => {
  for (const row of rows) {
    const expected = configurationalEntropyFromSortedJson(row.sortedJsonValue);
    assert.ok(expected != null, `row ${row.id} must resolve configurational entropy`);
    assert.equal(Number(row.data.configurational_entropy), expected, `row ${row.id}`);
  }
  assert.equal(Number(rows[0].data.configurational_entropy), 1.609438);
  assert.equal(Number(rows[6].data.configurational_entropy), 1.593216);
  assert.equal(Number(rows[30].data.configurational_entropy), 0.936888);
  assert.equal(Number(rows[255].data.configurational_entropy), 1.609438);
  assert.equal(formatConfigurationalEntropy(rows[0].data.configurational_entropy), '1.609');
  assert.equal(formatConfigurationalEntropy(''), '—');
});

test('sortRowsByEntropy orders by value, keeps ties stable, and places missing last', () => {
  const sample = [
    { id: 3, data: { configurational_entropy: '1.0' } },
    { id: 1, data: { configurational_entropy: '2.0' } },
    { id: 2, data: { configurational_entropy: '2.0' } },
    { id: 4, data: { configurational_entropy: '' } },
    { id: 5, data: {} },
  ];
  assert.deepEqual(sortRowsByEntropy(sample, '').map(row => row.id), [3, 1, 2, 4, 5]);
  assert.deepEqual(sortRowsByEntropy(sample, 'desc').map(row => row.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(sortRowsByEntropy(sample, 'asc').map(row => row.id), [3, 1, 2, 4, 5]);
});

test('empty selection preserves the original empty-result behavior', () => {
  assert.deepEqual(filterRows(rows, []), []);
  assert.deepEqual(filterRows(rows, [], 'oxide'), []);
});

test('material type filter narrows matches and all preserves the untyped filter', () => {
  const untyped = filterRows(rows, ['Hf']);
  assert.deepEqual(filterRows(rows, ['Hf'], 'all').map(row => row.id), untyped.map(row => row.id));
  const oxides = filterRows(rows, ['Hf'], 'oxide');
  assert.ok(oxides.length > 0);
  assert.ok(oxides.length < untyped.length);
  assert.ok(oxides.every(row => row.data.material_type === 'oxide'));
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
  assert.equal(assetPath('/', 'dataset/hec/'), '/dataset/hec/');
  assert.equal(assetPath('/research-gateway/', 'dataset/hec/'), '/research-gateway/dataset/hec/');
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
