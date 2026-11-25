/** Anion / metalloid symbols used to identify anion lattice sites. */
export const ANION_SYMBOLS = new Set([
  'B', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'Se', 'Br', 'Sb', 'Te', 'I', 'Sn', 'Ge', 'As', 'H',
]);

/** Stable display order for known material types in the explorer filter. */
export const MATERIAL_TYPE_ORDER = [
  'oxide', 'carbide', 'silicate', 'boride', 'telluride', 'chalcogenide', 'nitride',
  'carbonitride', 'sulfide', 'silicide', 'fluoride', 'selenide', 'antimonide',
  'phosphate', 'oxyfluoride', 'thiophosphate', 'chloride', 'stannate',
  'carbosilicate', 'stannide', 'iodide',
];

const MATERIAL_TYPE_LABELS = {
  oxide: ['氧化物', 'oxide'],
  carbide: ['碳化物', 'carbide'],
  silicate: ['硅酸盐', 'silicate'],
  boride: ['硼化物', 'boride'],
  telluride: ['碲化物', 'telluride'],
  chalcogenide: ['硫族化物', 'chalcogenide'],
  nitride: ['氮化物', 'nitride'],
  carbonitride: ['碳氮化物', 'carbonitride'],
  sulfide: ['硫化物', 'sulfide'],
  silicide: ['硅化物', 'silicide'],
  fluoride: ['氟化物', 'fluoride'],
  selenide: ['硒化物', 'selenide'],
  antimonide: ['锑化物', 'antimonide'],
  phosphate: ['磷酸盐', 'phosphate'],
  oxyfluoride: ['氧氟化物', 'oxyfluoride'],
  thiophosphate: ['硫代磷酸盐', 'thiophosphate'],
  chloride: ['氯化物', 'chloride'],
  stannate: ['锡酸盐', 'stannate'],
  carbosilicate: ['碳硅酸盐', 'carbosilicate'],
  stannide: ['锡化物', 'stannide'],
  iodide: ['碘化物', 'iodide'],
  phosphide: ['磷化物', 'phosphide'],
};

/**
 * Bilingual label for a material-type token. Unknown tokens display as themselves.
 * @param {string} type
 * @returns {[string, string]}
 */
export function materialTypeLabel(type) {
  if (type === 'all') return ['全部', 'all'];
  return MATERIAL_TYPE_LABELS[type] || [type, type];
}

/**
 * Sort material types by the stable official order, then any remaining tokens alphabetically.
 * @param {Iterable<string>} types
 * @returns {string[]}
 */
export function sortMaterialTypes(types) {
  const present = new Set([...types].filter(Boolean));
  const ordered = MATERIAL_TYPE_ORDER.filter(type => present.delete(type));
  return [...ordered, ...[...present].sort()];
}

const SINGLE_TYPE = {
  O: 'oxide',
  C: 'carbide',
  N: 'nitride',
  B: 'boride',
  F: 'fluoride',
  Cl: 'chloride',
  I: 'iodide',
  S: 'sulfide',
  Se: 'selenide',
  Te: 'telluride',
  Si: 'silicide',
  Sb: 'antimonide',
  Sn: 'stannide',
  P: 'phosphide',
};

const COMBO_TYPE = {
  'C+N': 'carbonitride',
  'F+O': 'oxyfluoride',
  'O+Si': 'silicate',
  'C+O+Si': 'carbosilicate',
  'O+P': 'phosphate',
  'O+Sn': 'stannate',
  'P+S': 'thiophosphate',
};

const CHALCOGENS = new Set(['S', 'Se', 'Te']);
const OCCUPANCY_THRESHOLD = 0.05;

/**
 * Keep anion occupants at or above 5% occupancy. If none qualify, keep the largest.
 * @param {{ name: string, value: number }[]} anions
 */
function significantAnions(anions) {
  const kept = anions.filter(entry => entry.value >= OCCUPANCY_THRESHOLD);
  if (kept.length) return kept.map(entry => entry.name);
  if (!anions.length) return [];
  const largest = anions.reduce((best, entry) => (entry.value > best.value ? entry : best));
  return [largest.name];
}

/**
 * Collect anion symbols from one lattice site.
 * @param {Record<string, number>} occupancy
 * @returns {{ symbols: string[], pureAnionSite: boolean }}
 */
function anionsFromSite(occupancy) {
  const occupants = Object.entries(occupancy)
    .filter(([symbol]) => symbol !== 'X')
    .map(([name, value]) => ({ name, value: Number(value) }));
  if (!occupants.length) return { symbols: [], pureAnionSite: false };
  const anions = occupants.filter(entry => ANION_SYMBOLS.has(entry.name));
  const pureAnionSite = anions.length === occupants.length;
  return { symbols: significantAnions(anions), pureAnionSite };
}

/**
 * Map a sorted anion-element signature to a material-type label.
 * @param {string[]} symbols
 */
export function labelFromAnionSymbols(symbols) {
  const unique = [...new Set(symbols)].sort();
  if (!unique.length) return '';
  const key = unique.join('+');
  if (COMBO_TYPE[key]) return COMBO_TYPE[key];
  if (unique.length === 1 && SINGLE_TYPE[unique[0]]) return SINGLE_TYPE[unique[0]];
  if (unique.length >= 2 && unique.every(symbol => CHALCOGENS.has(symbol))) return 'chalcogenide';
  return '';
}

/**
 * Derive a high-entropy material type from a Sorted Json formula string.
 * @param {string} sortedJsonText
 * @returns {string}
 */
export function materialTypeFromSortedJson(sortedJsonText) {
  let composition;
  try { composition = JSON.parse(sortedJsonText); } catch { return ''; }
  if (!composition || typeof composition !== 'object' || Array.isArray(composition)) return '';

  const fromAnionSites = [];
  const fromMixedSites = [];
  for (const occupancy of Object.values(composition)) {
    if (!occupancy || typeof occupancy !== 'object' || Array.isArray(occupancy)) continue;
    const { symbols, pureAnionSite } = anionsFromSite(occupancy);
    if (pureAnionSite) fromAnionSites.push(...symbols);
    else fromMixedSites.push(...symbols);
  }

  return labelFromAnionSymbols(fromAnionSites.length ? fromAnionSites : fromMixedSites);
}
