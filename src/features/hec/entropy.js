/**
 * Ideal mixing entropy of one lattice site, in units of R.
 * Occupancies are normalized to fractions so raw amounts such as 1.0 each still work.
 * @param {Record<string, number>} occupancy
 * @returns {number}
 */
export function siteConfigurationalEntropy(occupancy) {
  if (!occupancy || typeof occupancy !== 'object' || Array.isArray(occupancy)) return 0;
  const values = Object.values(occupancy)
    .map(Number)
    .filter(value => Number.isFinite(value) && value > 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || values.length < 2) return 0;
  return -values.reduce((sum, value) => {
    const fraction = value / total;
    return sum + fraction * Math.log(fraction);
  }, 0);
}

/**
 * Maximum site configurational entropy from a Sorted Json formula string, in units of R.
 * Rounded to 6 decimal places. Invalid JSON returns null.
 * @param {string} sortedJsonText
 * @returns {number | null}
 */
export function configurationalEntropyFromSortedJson(sortedJsonText) {
  let composition;
  try { composition = JSON.parse(sortedJsonText); } catch { return null; }
  if (!composition || typeof composition !== 'object' || Array.isArray(composition)) return null;
  let maximum = 0;
  let found = false;
  for (const occupancy of Object.values(composition)) {
    if (!occupancy || typeof occupancy !== 'object' || Array.isArray(occupancy)) continue;
    found = true;
    maximum = Math.max(maximum, siteConfigurationalEntropy(occupancy));
  }
  if (!found) return null;
  return Number(maximum.toFixed(6));
}

/**
 * Format a stored configurational_entropy value for the explorer table (3 decimal places).
 * @param {string | number | null | undefined} value
 * @returns {string}
 */
export function formatConfigurationalEntropy(value) {
  if (value == null || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : '—';
}
