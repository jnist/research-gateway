import { rowsFromCsv, filterRows, exportRows } from './data.js';
import { PERIODIC_TABLE_LAYOUT, LANTHANIDE_LAYOUT, ATOMIC_NUMBERS, ELEMENT_NAMES, ENGLISH_ELEMENT_NAMES, elementMatchesQuery, elementCategory } from './elements.js';
import { escapeHtml, buildPrettyFormula, formatChemicalText, extractDois, paperTitle } from './format.js';
import { validateIndexes } from './indexes.js';
import { HecError, errorMessage } from './messages.js';
import { getLocale, translate as t } from '../../lib/i18n.js';

export function initExplorer(root, { assetBaseUrl, version }) {
  const el = id => root.querySelector(`#${id}`);
  const state = { rows: [], selected: new Set(), page: 1, pageSize: 25, official: false, indexes: { cifs: {}, supercells: {}, titles: {} }, loadEpoch: 0, sourceLabel: '', loading: false, error: null };
  let available = new Set();
  const elementName = symbol => t(ELEMENT_NAMES[symbol], ENGLISH_ELEMENT_NAMES[symbol]);
  const morePapers = count => t(`另 ${count} 篇文献`, `${count} more ${count === 1 ? 'paper' : 'papers'}`);
  const localStructureTitle = () => t('本地数据不关联官方结构', 'Local data is not linked to official structures');

  function structureLinks(row, key, directory, label) {
    if (!state.official) return `<span class="muted" data-local-structure title="${localStructureTitle()}">—</span>`;
    const files = state.indexes[key]?.[String(row.id - 1)] || [];
    return files.map(file => `<a class="structure-link" href="${escapeHtml(`${assetBaseUrl}structures/${directory}/${encodeURIComponent(file)}`)}" download title="${escapeHtml(file)}">${label}</a>`).join('') || '<span class="muted">—</span>';
  }

  function renderPapers(row) {
    const links = extractDois(row.data.DOIs).map(doi => `<a class="paper-link" href="${escapeHtml(doi)}" target="_blank" rel="noopener noreferrer">${paperTitle(doi, state.indexes.titles)}</a>`);
    if (!links.length) return '<span class="muted">—</span>';
    return links[0] + (links.length > 1 ? `<details><summary data-more-papers="${links.length - 1}">${morePapers(links.length - 1)}</summary>${links.slice(1).join('')}</details>` : '');
  }

  function matches() { return filterRows(state.rows, [...state.selected]); }

  function renderResults(labelsOnly = false) {
    const filtered = matches();
    const pages = Math.ceil(filtered.length / state.pageSize);
    state.page = Math.min(state.page, pages || 1);
    const offset = (state.page - 1) * state.pageSize;
    const range = `${offset + 1}–${Math.min(offset + state.pageSize, filtered.length)}`;
    el('resultCount').textContent = state.selected.size
      ? t(`${filtered.length} 条匹配记录${filtered.length ? ` · 显示 ${range}` : ''}`, `${filtered.length} matching ${filtered.length === 1 ? 'record' : 'records'}${filtered.length ? ` · Showing ${range}` : ''}`)
      : t('尚未选择元素', 'No elements selected');
    if (labelsOnly) {
      el('resultsBody').querySelectorAll('[data-more-papers]').forEach(summary => { summary.textContent = morePapers(Number(summary.dataset.morePapers)); });
      el('resultsBody').querySelectorAll('[data-local-structure]').forEach(label => { label.title = localStructureTitle(); });
    } else el('resultsBody').innerHTML = filtered.slice(offset, offset + state.pageSize).map(row => `<tr>
      <td>${String(row.id).padStart(3, '0')}</td>
      <td class="formula-cell">${buildPrettyFormula(row.sortedJsonValue, row.data.prototype_formula)}</td>
      <td>${formatChemicalText(row.data.prototype || '—')}</td>
      <td>${structureLinks(row, 'cifs', 'cifs', 'CIF')}</td>
      <td>${structureLinks(row, 'supercells', 'relaxed-supercells', 'VASP')}</td>
      <td>${renderPapers(row)}</td>
    </tr>`).join('');
    el('emptyState').hidden = filtered.length > 0;
    el('emptyState').querySelector('span').textContent = state.selected.size ? t('暂无符合条件的组分', 'No matching compositions') : t('尚未选择元素', 'No elements selected');
    el('exportResults').disabled = !filtered.length;
    el('prevPage').disabled = state.page <= 1;
    el('nextPage').disabled = !pages || state.page >= pages;
    el('pageInfo').textContent = `${pages ? state.page : 0} / ${pages}`;
  }

  function renderSelection(labelsOnly = false) {
    if (labelsOnly) {
      const label = el('selectedElements').querySelector('span');
      if (label) label.textContent = t('无', 'None');
      el('selectedElements').querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-label', t(`移除 ${button.dataset.symbol}`, `Remove ${button.dataset.symbol}`));
      });
      return;
    }
    el('selectedElements').replaceChildren();
    if (!state.selected.size) {
      const label = document.createElement('span');
      label.textContent = t('无', 'None');
      el('selectedElements').append(label);
    }
    [...state.selected].sort().forEach(symbol => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'element-chip';
      button.dataset.symbol = symbol;
      button.setAttribute('aria-label', t(`移除 ${symbol}`, `Remove ${symbol}`));
      button.textContent = `${symbol} ×`;
      button.addEventListener('click', () => toggle(symbol));
      el('selectedElements').append(button);
    });
    root.querySelectorAll('.element').forEach(button => button.setAttribute('aria-pressed', String(state.selected.has(button.dataset.symbol))));
    el('clearSelection').disabled = !state.selected.size;
  }

  function toggle(symbol) {
    if (!available.has(symbol)) return;
    state.selected.has(symbol) ? state.selected.delete(symbol) : state.selected.add(symbol);
    state.page = 1;
    renderSelection();
    renderResults();
  }

  function updateElementLabel(button) {
    const symbol = button.dataset.symbol;
    button.title = `${symbol} · ${elementName(symbol)}${button.disabled ? t(' · 数据未收录', ' · Not in dataset') : ''}`;
    button.setAttribute('aria-label', `${symbol} ${elementName(symbol)}`);
    button.querySelector('.element-name').textContent = elementName(symbol);
  }

  function renderPeriodicTable(labelsOnly = false) {
    if (labelsOnly) {
      root.querySelectorAll('.element').forEach(updateElementLabel);
      return;
    }
    for (const [id, layout] of [['periodicTable', PERIODIC_TABLE_LAYOUT.flat()], ['lanthanideTable', LANTHANIDE_LAYOUT]]) {
      const container = el(id);
      container.replaceChildren();
      layout.forEach(symbol => {
        if (!symbol) {
          const spacer = document.createElement('div');
          spacer.className = 'placeholder';
          container.append(spacer);
          return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `element ${elementCategory(symbol)}`;
        button.dataset.symbol = symbol;
        button.disabled = !available.has(symbol);
        button.setAttribute('aria-pressed', String(state.selected.has(symbol)));
        button.innerHTML = `<small>${ATOMIC_NUMBERS[symbol]}</small><strong>${symbol}</strong><span class="element-name"></span>`;
        updateElementLabel(button);
        button.addEventListener('click', () => toggle(symbol));
        container.append(button);
      });
    }
  }

  function clearSearch() {
    el('elementSearch').value = '';
    el('searchResults').hidden = true;
    el('searchResults').replaceChildren();
  }

  function renderStatus() {
    const count = state.rows.length;
    const source = state.official ? t(`官方数据 v${version}`, `Official data v${version}`) : t(`本地数据 · ${state.sourceLabel}`, `Local data · ${state.sourceLabel}`);
    el('statusText').textContent = state.loading ? t('正在加载官方数据…', 'Loading official data…')
      : count ? `${source} · ${t(`${count} 条记录`, `${count} ${count === 1 ? 'record' : 'records'}`)}${state.official ? '' : t(' · 不关联官方结构', ' · Not linked to official structures')}`
      : t('数据未加载', 'Data not loaded');
    el('loadError').hidden = !state.error;
    // Raw parser, network and filename details must never be interpreted as HTML.
    el('loadError').textContent = state.error ? `${errorMessage(state.error, getLocale())}${count
      ? t('。已保留当前数据。', '. Current data has been retained.')
      : t('。可重新加载或导入本地 CSV。', '. Reload or import a local CSV.')}` : '';
  }

  function applyDataset(rows, official, label) {
    state.rows = rows;
    state.official = official;
    state.selected.clear();
    state.page = 1;
    available = new Set(rows.flatMap(row => [...row.elements]));
    state.sourceLabel = label;
    state.loading = false;
    state.error = null;
    renderStatus();
    el('metricRecords').textContent = String(rows.length);
    el('metricElements').textContent = String(available.size);
    el('metricPrototypes').textContent = String(new Set(rows.map(row => row.data.prototype).filter(Boolean)).size);
    clearSearch();
    renderPeriodicTable();
    renderSelection();
    renderResults();
  }

  function showError(error) {
    state.loading = false;
    state.error = error instanceof HecError ? error : new HecError(`数据加载失败：${errorMessage(error)}`, `Data loading failed: ${errorMessage(error, 'en')}`);
    renderStatus();
  }

  async function loadDefault() {
    const epoch = ++state.loadEpoch;
    el('restoreDataset').disabled = true;
    state.loading = true;
    renderStatus();
    try {
      const [csvResponse, indexResponse] = await Promise.all([fetch(`${assetBaseUrl}dataset.csv`), fetch(`${assetBaseUrl}indexes.json`)]);
      if (!csvResponse.ok || !indexResponse.ok) {
        const status = !csvResponse.ok ? csvResponse.status : indexResponse.status;
        throw new HecError(`官方数据加载失败（HTTP ${status}）`, `Official data loading failed (HTTP ${status})`);
      }
      const [text, indexes] = await Promise.all([csvResponse.text(), indexResponse.json()]);
      const rows = rowsFromCsv(text);
      if (epoch !== state.loadEpoch) return;
      state.indexes = validateIndexes(indexes, rows.length);
      applyDataset(rows, true, '官方数据');
    } catch (error) { if (epoch === state.loadEpoch) showError(error); }
    finally { if (epoch === state.loadEpoch) el('restoreDataset').disabled = false; }
  }

  el('csvFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const epoch = ++state.loadEpoch;
    try {
      if (file.size > 10 * 1024 * 1024) throw new HecError('CSV 文件超过 10 MB', 'CSV file exceeds 10 MB');
      const rows = rowsFromCsv(await file.text());
      if (epoch === state.loadEpoch) applyDataset(rows, false, file.name);
    } catch (error) { if (epoch === state.loadEpoch) showError(error); }
    finally {
      event.target.value = '';
      if (epoch === state.loadEpoch) el('restoreDataset').disabled = false;
    }
  });
  el('restoreDataset').addEventListener('click', loadDefault);
  el('clearSelection').addEventListener('click', () => {
    state.selected.clear();
    state.page = 1;
    clearSearch();
    renderSelection();
    renderResults();
  });
  function renderSearch(labelsOnly = false) {
    const query = el('elementSearch').value.trim().toLowerCase();
    const results = el('searchResults');
    if (labelsOnly) {
      results.querySelectorAll('button').forEach(button => {
        button.textContent = `${button.dataset.symbol} · ${elementName(button.dataset.symbol)}`;
      });
      const message = results.querySelector('p');
      if (message) message.textContent = t('未找到已收录元素', 'No matching elements in this dataset');
      return;
    }
    results.replaceChildren();
    results.hidden = !query;
    if (!query) return;
    const symbols = [...available].filter(symbol => elementMatchesQuery(symbol, query));
    // Exact symbols take precedence over substrings in English element names.
    symbols.sort((a, b) => Number(b.toLowerCase() === query) - Number(a.toLowerCase() === query) || ATOMIC_NUMBERS[a] - ATOMIC_NUMBERS[b]).forEach(symbol => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.symbol = symbol;
      button.textContent = `${symbol} · ${elementName(symbol)}`;
      button.addEventListener('click', () => { toggle(symbol); clearSearch(); el('elementSearch').focus(); });
      results.append(button);
    });
    if (!symbols.length) { const message = document.createElement('p'); message.textContent = t('未找到已收录元素', 'No matching elements in this dataset'); results.append(message); }
  }
  el('elementSearch').addEventListener('input', () => renderSearch());
  el('elementSearch').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); el('searchResults').querySelector('button')?.click(); }
    if (event.key === 'Escape') clearSearch();
    if (event.key === 'ArrowDown') { event.preventDefault(); el('searchResults').querySelector('button')?.focus(); }
  });
  root.addEventListener('click', event => {
    if (!event.target.closest('.element-search')) el('searchResults').hidden = true;
  });
  el('pageSize').addEventListener('change', event => { state.pageSize = Number(event.target.value); state.page = 1; renderResults(); });
  el('prevPage').addEventListener('click', () => { state.page--; renderResults(); el('resultsBody').closest('.results-wrap').scrollTop = 0; });
  el('nextPage').addEventListener('click', () => { state.page++; renderResults(); el('resultsBody').closest('.results-wrap').scrollTop = 0; });
  el('exportResults').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF', exportRows(matches())], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.official ? `hec-v${version}` : 'hec-local'}-${[...state.selected].sort().join('-')}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('localechange', () => {
    renderStatus();
    renderPeriodicTable(true);
    renderSelection(true);
    renderResults(true);
    renderSearch(true);
  });
  renderPeriodicTable();
  renderSelection();
  renderResults();
  loadDefault();
}
