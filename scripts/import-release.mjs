import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { rowsFromCsv } from '../src/features/hec/data.js';
import { validateIndexes } from '../src/features/hec/indexes.js';

const source = path.resolve(process.argv[2] || 'temp/Release code/Frontend');
const target = path.resolve('public/data/hec/v1.0');
if (existsSync(target)) throw new Error('版本目录已存在；禁止重写已发布快照。新数据必须使用新版本目录。');
await mkdir(target, { recursive: true });
await cp(path.join(source, 'data/hec-dataset-v1.0.csv'), path.join(target, 'dataset.csv'), { force: false });
await cp(path.join(source, 'structures'), path.join(target, 'structures'), { recursive: true, force: false });
await cp(path.join(source, 'LICENSE'), path.join(target, 'CODE-LICENSE.txt'), { force: false });
const resources = {};
for (const [file, global, key] of [
  ['cifs_index.js', 'CIFS', 'cifs'],
  ['relaxed_supercells_index.js', 'RELAXED_SUPERCELLS', 'supercells'],
  ['doi_titles.js', 'DOI_TITLES', 'titles'],
]) {
  const context = vm.createContext({ window: {} });
  vm.runInContext(await readFile(path.join(source, 'js', file), 'utf8'), context, { timeout: 1000 });
  resources[key] = context.window[global];
}
await writeFile(path.join(target, 'indexes.json'), JSON.stringify(resources));
const csv = await readFile(path.join(target, 'dataset.csv'));
const rows = rowsFromCsv(csv.toString('utf8'));
validateIndexes(resources, rows.length);
const manifest = {
  name: 'High-Entropy Ceramics Database',
  version: '1.0',
  importedAt: '2026-09-10',
  source: 'User-provided Frontend release; original release date unspecified',
  dataset: 'dataset.csv',
  records: rows.length,
  elements: new Set(rows.flatMap(row => [...row.elements])).size,
  prototypes: new Set(rows.map(row => row.data.prototype).filter(Boolean)).size,
  cifFiles: Object.values(resources.cifs).flat().length,
  supercellFiles: Object.values(resources.supercells).flat().length,
  sha256: createHash('sha256').update(csv).digest('hex'),
  codeLicense: 'MIT',
  dataLicense: 'Not specified in the source release. Confirm with the authors before redistribution.',
  structureIndex: 'Original zero-based CSV record position; never local imported row position',
};
await writeFile(path.join(target, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
