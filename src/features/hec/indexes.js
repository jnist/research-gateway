import { HecError } from './messages.js';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateIndexes(indexes, rowCount) {
  if (!isRecord(indexes) || !['cifs', 'supercells', 'titles'].every(key => isRecord(indexes[key]))) {
    throw new HecError('索引文件缺少有效的 cifs、supercells 或 titles', 'Index file is missing valid cifs, supercells, or titles');
  }
  for (const key of ['cifs', 'supercells']) {
    for (const [index, files] of Object.entries(indexes[key])) {
      if (!/^\d+$/.test(index) || Number(index) >= rowCount || !Array.isArray(files)) throw new HecError('结构索引记录编号无效', 'Invalid record ID in structure index');
      for (const file of files) {
        const match = typeof file === 'string' && file.match(/^row(\d+)_[^/\\]+\.(cif|vasp)$/);
        if (!match || Number(match[1]) !== Number(index) || match[2] !== (key === 'cifs' ? 'cif' : 'vasp')) {
          throw new HecError('结构索引文件名与记录编号不一致', 'Structure index filename does not match its record ID');
        }
      }
    }
  }
  if (Object.values(indexes.titles).some(title => typeof title !== 'string')) throw new HecError('文献标题索引无效', 'Invalid paper title index');
  return indexes;
}
