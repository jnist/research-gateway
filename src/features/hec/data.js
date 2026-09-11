import Papa from 'papaparse';
import { VALID_SYMBOLS } from './elements.js';
import { HecError, errorMessage } from './messages.js';

/** @typedef {{id: number, data: Record<string, string>, sortedJsonValue: string, sites: Record<string, Set<string>>, elements: Set<string>}} HecRow */

export function parseSitesFromSortedJson(text) {
  let composition;
  try { composition = JSON.parse(text); } catch { throw new HecError('化学式 JSON 无效', 'Invalid chemical formula JSON'); }
  if (!composition || typeof composition !== 'object' || Array.isArray(composition)) throw new HecError('JSON 必须包含晶格位点', 'JSON must contain lattice sites');
  const sites = Object.create(null);
  for (const [site, values] of Object.entries(composition)) {
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new HecError(`位点 ${site} 无效`, `Invalid site ${site}`);
    const elements = Object.keys(values);
    // X denotes an unoccupied site in the release; it is not a selectable element.
    if (!elements.length || elements.some(symbol => symbol !== 'X' && !VALID_SYMBOLS.has(symbol))) throw new HecError(`位点 ${site} 包含无效元素`, `Site ${site} contains invalid elements`);
    if (Object.values(values).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new HecError(`位点 ${site} 占比无效`, `Invalid occupancy at site ${site}`);
    sites[site] = new Set(elements.filter(symbol => VALID_SYMBOLS.has(symbol)));
  }
  if (!Object.keys(sites).length) throw new HecError('JSON 没有晶格位点', 'JSON contains no lattice sites');
  return sites;
}

export function rowsFromCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.trim().replace(/\uFEFF/g, ''),
  });
  if (parsed.errors.length) throw new HecError(`CSV 格式错误：${parsed.errors[0].message}`, `Invalid CSV format: ${parsed.errors[0].message}`);
  const headers = parsed.meta.fields || [];
  const key = headers.find(header => header === 'Sorted Json formula' || header === 'Sorted Json formula,');
  if (!key) throw new HecError('CSV 缺少 Sorted Json formula 列', 'CSV is missing the Sorted Json formula column');
  if (new Set(headers).size !== headers.length || parsed.meta.renamedHeaders) throw new HecError('CSV 列名重复', 'CSV contains duplicate column names');
  if (!parsed.data.length) throw new HecError('CSV 没有数据记录', 'CSV contains no data records');
  const ids = new Set();
  return parsed.data.map((data, index) => {
    try {
      const sites = parseSitesFromSortedJson(data[key]);
      const id = headers.includes('record_id') ? Number(data.record_id) : index + 1;
      if (!Number.isSafeInteger(id) || id < 1 || ids.has(id)) throw new HecError('record_id 必须是唯一的正整数 ID', 'record_id must be a unique positive integer ID');
      ids.add(id);
      return {
        id, data, sortedJsonValue: data[key], sites,
        elements: new Set(Object.values(sites).flatMap(elements => [...elements])),
      };
    } catch (error) { throw new HecError(`CSV 第 ${index + 2} 行：${errorMessage(error, 'zh')}`, `CSV row ${index + 2}: ${errorMessage(error, 'en')}`); }
  });
}

// Preserved from the original explorer: AND within one site, not across sites.
export function rowMatchesSelection(sites, selected) {
  return Object.values(sites).some(elements => selected.every(element => elements.has(element)));
}

/** @param {HecRow[]} rows @param {string[]} selected @returns {HecRow[]} */
export function filterRows(rows, selected) {
  return selected.length ? rows.filter(row => rowMatchesSelection(row.sites, selected)) : [];
}

export function exportRows(rows) {
  if (!rows.length) return '';
  return Papa.unparse(rows.map(row => {
    const { record_id: ignored, ...data } = row.data;
    return { record_id: row.id, ...data };
  }), { escapeFormulae: true });
}
