import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { rowsFromCsv } from '../src/features/hec/data.js';
import { validateIndexes } from '../src/features/hec/indexes.js';

const root = path.resolve('public/data/hec/v1.0');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const csv = await readFile(path.join(root, manifest.dataset));
const rows = rowsFromCsv(csv.toString('utf8'));
const indexes = JSON.parse(await readFile(path.join(root, 'indexes.json'), 'utf8'));
validateIndexes(indexes, rows.length);
assert.equal(createHash('sha256').update(csv).digest('hex'), manifest.sha256, 'Dataset checksum changed');
assert.equal(rows.length, manifest.records);
assert.equal(new Set(rows.flatMap(row => [...row.elements])).size, manifest.elements);
assert.equal(new Set(rows.map(row => row.data.prototype).filter(Boolean)).size, manifest.prototypes);
for (const [key, directory, count] of [
  ['cifs', 'cifs', manifest.cifFiles], ['supercells', 'relaxed-supercells', manifest.supercellFiles],
]) {
  const files = Object.values(indexes[key]).flat();
  assert.equal(files.length, count);
  assert.equal((await readdir(path.join(root, 'structures', directory))).length, count, 'Unindexed structure asset');
  for (const [index, filenames] of Object.entries(indexes[key])) {
    assert.ok(Number(index) >= 0 && Number(index) < rows.length, 'Structure row out of bounds');
    for (const filename of filenames) {
      assert.equal(path.basename(filename), filename);
      assert.equal(Number(filename.match(/^row(\d+)_/)?.[1]), Number(index));
      assert.ok((await stat(path.join(root, 'structures', directory, filename))).size > 0);
    }
  }
}
console.log(`Validated ${rows.length} records, ${manifest.cifFiles} CIFs, ${manifest.supercellFiles} supercells, and SHA-256.`);
