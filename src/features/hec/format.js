// Formula formatting adapted from the MIT-licensed original HEC explorer.
// Copyright (c) 2026 High-Entropy Ceramics Database contributors.
export function escapeHtml(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatAmountSubscript(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number - 1) < 1e-10) return '';
  return `<sub>${number.toFixed(4).replace(/\.?0+$/, '')}</sub>`;
}

export function formatChemicalText(text) {
  return escapeHtml(text).replace(/(\d+\.?\d*|\.\d+)/g, '<sub>$1</sub>');
}

function parsePrototypeFormula(text) {
  try { return JSON.parse(text.replace(/'/g, '"')) || {}; } catch { return {}; }
}

export function buildPrettyFormula(sortedJsonText, prototypeFormulaText = '') {
  try {
    const composition = JSON.parse(sortedJsonText);
    const coefficients = parsePrototypeFormula(prototypeFormulaText);
    const order = Object.keys(coefficients).length ? Object.keys(coefficients) : Object.keys(composition).sort();
    return order.map(site => {
      const value = composition[site];
      if (!value || typeof value !== 'object') return '';
      const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
      const coefficient = Number(coefficients[site] ?? 1);
      if (entries.length === 1) return `${escapeHtml(entries[0][0])}${formatAmountSubscript(Number(entries[0][1]) * coefficient)}`;
      if (!entries.length) return '';
      const inner = entries.map(([element, fraction]) => `${escapeHtml(element)}${formatAmountSubscript(fraction)}`).join('');
      return `(${inner})${formatAmountSubscript(coefficient)}`;
    }).join('');
  } catch { return formatChemicalText(sortedJsonText); }
}

export function extractDois(text) {
  return [...new Set(String(text || '').match(/https?:\/\/doi\.org\/[^\s'",\]<>]+/g) || [])];
}

export function paperTitle(doi, titles) {
  let key;
  try { key = decodeURIComponent(new URL(doi).pathname.slice(1)); } catch { return escapeHtml(doi); }
  const title = titles?.[key] || key;
  return escapeHtml(title).replace(/&lt;sub&gt;/gi, '<sub>').replace(/&lt;\/sub&gt;/gi, '</sub>');
}
