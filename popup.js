'use strict';

// ── Icons ────────────────────────────────────────────────────────────────────
const I = {
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
};

const SYM = {
  UAH: '₴', USD: '$', EUR: '€', GBP: '£', PLN: 'zł', JPY: '¥', CNY: '¥', TRY: '₺', INR: '₹',
  KRW: '₩', ILS: '₪', CHF: 'Fr', CZK: 'Kč', GEL: '₾', KZT: '₸', BTC: '₿', ETH: 'Ξ', THB: '฿',
  VND: '₫', PHP: '₱', NGN: '₦', AMD: '֏', AZN: '₼', BRL: 'R$', CAD: 'C$', AUD: 'A$', NZD: 'NZ$',
  HKD: 'HK$', SGD: 'S$', MXN: 'Mex$', SEK: 'kr', NOK: 'kr', DKK: 'kr', ISK: 'kr', HUF: 'Ft', RON: 'lei',
};
const sym = c => SYM[c] || c;

// ── State ────────────────────────────────────────────────────────────────────
const DEFAULT_LIST = ['UAH', 'USD', 'EUR', 'PLN'];
const S = {
  lang: null, source: 'market', list: [...DEFAULT_LIST], home: 'UAH', active: 'USD',
  amount: 100, markup: 0, decimals: 2, theme: null,
  data: null, online: null,
};
const PERSIST = ['lang', 'source', 'list', 'home', 'active', 'amount', 'markup', 'decimals', 'theme'];
const save = (...keys) => chrome.storage.local.set(Object.fromEntries((keys.length ? keys : PERSIST).map(k => [k, S[k]])));

const $ = id => document.getElementById(id);
const $rows = $('rows'), $big = $('big');

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  $('ver').textContent = chrome.runtime.getManifest().version;
  $('btn-refresh').innerHTML = I.refresh;
  $('btn-settings').innerHTML = I.gear;

  const saved = await chrome.storage.local.get([...PERSIST, 'rates_market', 'rates_nbu']);
  for (const k of PERSIST) if (saved[k] !== undefined && saved[k] !== null) S[k] = saved[k];
  if (!Array.isArray(S.list) || S.list.length < 2) S.list = [...DEFAULT_LIST];
  if (!S.list.includes(S.active)) S.active = S.list[0];
  if (!S.lang) S.lang = (navigator.language || '').toLowerCase().startsWith('uk') ? 'uk' : 'en';
  LANG = S.lang;

  applyTheme();
  applyI18n();
  $('fee').value = S.markup || 0;
  syncFee();

  S.data = saved[`rates_${S.source}`] || null;
  render();
  $big.focus();
  $big.select();
  refresh(false);
}

async function refresh(force) {
  $('btn-refresh').classList.add('spin');
  try {
    const res = await chrome.runtime.sendMessage({ type: 'FETCH_RATES', source: S.source, force });
    if (!res || !res.ok) throw new Error(res ? res.error : 'no response');
    S.data = res.data;
    S.online = true;
  } catch (e) {
    S.online = false;
    console.warn('[converter] fetch failed:', e.message);
  } finally {
    $('btn-refresh').classList.remove('spin');
  }
  render({ keepBig: document.activeElement === $big });
}

// ── Math ─────────────────────────────────────────────────────────────────────
const rate = c => S.data && S.data.rates[c];

function rawValue(code) {           // without fee
  const ra = rate(S.active), rc = rate(code);
  if (!ra || !rc) return null;
  return code === S.active ? S.amount : S.amount * ra / rc;
}
function valueOf(code) {            // with fee
  const v = rawValue(code);
  if (v === null || code === S.active) return v;
  return v * (1 + (S.markup || 0) / 100);
}

// ── Format / parse ───────────────────────────────────────────────────────────
function fmt(n, dec = S.decimals) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a !== 0 && a < 1) return n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
  const r = Math.round(n * 10 ** dec) / 10 ** dec;
  return r.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(r) ? 0 : dec, maximumFractionDigits: dec });
}
function fmtRate(n) {
  if (!isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

function parseAmount(raw) {
  let s = String(raw).trim().replace(/[\s ']/g, '').toLowerCase();
  if (!s) return null;
  if (s.includes('.') && s.includes(',')) s = s.replace(/,/g, '');
  else if (s.includes(',')) s = /,\d{3}(?!\d)/.test(s) && !/,\d{1,2}(?!\d)/.test(s) ? s.replace(/,/g, '') : s.replace(/,/g, '.');
  s = s.replace(/(\d+(?:\.\d+)?)[kк]/g, '($1*1000)').replace(/(\d+(?:\.\d+)?)[mм]/g, '($1*1000000)');
  s = s.replace(/[×x]/g, '*').replace(/[÷:]/g, '/');
  if (!/^[\d.+\-*/()]+$/.test(s)) return null;
  try { const v = evalExpr(s); return isFinite(v) ? v : null; } catch { return null; }
}
function evalExpr(src) {
  let i = 0;
  const peek = () => src[i];
  const num = () => {
    const m = /^\d*\.?\d+|^\d+\.?/.exec(src.slice(i));
    if (!m) throw new Error('num');
    i += m[0].length; return parseFloat(m[0]);
  };
  const factor = () => {
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    if (peek() === '(') { i++; const v = expr(); if (src[i++] !== ')') throw new Error(')'); return v; }
    return num();
  };
  const term = () => { let v = factor(); while (peek() === '*' || peek() === '/') { const op = src[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const op = src[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const v = expr();
  if (i !== src.length) throw new Error('trailing');
  return v;
}

function flagHTML(code) {
  const meta = CURRENCIES[code];
  if (meta && meta[0]) return `<span class="flag"><img src="flags/${meta[0]}.svg" alt=""></span>`;
  const map = { BTC: '₿', ETH: 'Ξ', USDT: '₮', XAU: 'Au', XAG: 'Ag' };
  const metal = code === 'XAU' || code === 'XAG' ? ' metal' : '';
  return `<span class="flag txt${metal}">${map[code] || code.slice(0, 2)}</span>`;
}

// ── Render ───────────────────────────────────────────────────────────────────
function render(opts = {}) {
  renderHero(opts);
  renderRows();
  $('src-label').textContent = t(S.source === 'nbu' ? 'srcNbu' : 'srcMarket');
}

function renderHero({ keepBig } = {}) {
  $('pill').innerHTML = `${flagHTML(S.active)}<span>${S.active}</span><span class="chev">▼</span>`;
  if (!keepBig) { $big.value = fmt(S.amount); fitBig(); }
  renderRateLine();
}

function renderRateLine() {
  const dot = $('dot');
  const time = S.data ? fmtTime(S.data.fetchedAt) : '';
  if (!S.data) {
    dot.className = 'dot' + (S.online === false ? ' err' : '');
    $('rateline').textContent = S.online === false ? t('noRates') : t('loading');
    return;
  }
  const x = S.active !== S.home ? S.active : (S.list.find(c => c !== S.home && rate(c)) || 'USD');
  const r = rate(x) && rate(S.home) ? rate(x) / rate(S.home) : null;
  const pair = r ? `1 ${x} = ${fmtRate(r)} ${sym(S.home)}` : '';
  dot.className = 'dot ' + (S.online === false ? 'err' : 'ok');
  $('rateline').textContent = S.online === false ? `${t('offline')} · ${time}` : [pair, time].filter(Boolean).join(' · ');
}

function fmtTime(ts) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  const loc = LANG === 'uk' ? 'uk-UA' : 'en-GB';
  const tm = d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  return sameDay ? tm : `${d.toLocaleDateString(loc, { day: 'numeric', month: 'short' })} ${tm}`;
}

function fitBig() {
  const len = $big.value.length;
  $big.style.fontSize = len > 13 ? '28px' : len > 10 ? '34px' : len > 7 ? '42px' : '52px';
}

function renderRows() {
  $rows.innerHTML = '';
  const others = S.list.filter(c => c !== S.active);
  for (const code of others) $rows.appendChild(makeRow(code));
}

function makeRow(code) {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.code = code;
  row.draggable = true;
  const v = valueOf(code);
  const per = rate(S.active) && rate(code) ? rate(S.active) / rate(code) : null;
  row.innerHTML = `
    ${flagHTML(code)}
    <div class="cn"><b>${code}</b><small>${currencyName(code)}</small></div>
    <div class="val${v === null ? ' na' : ''}" ${v === null ? `title="${t('noRate')}"` : ''}>
      <b>${fmt(v)}</b><small>${per ? `${fmtRate(per)} / ${sym(S.active)}` : '&nbsp;'}</small>
    </div>
    <button class="more" title="⋯">${I.more}</button>`;
  row.addEventListener('click', e => {
    if (e.target.closest('.more')) return;
    if (v !== null) makeMain(code);
  });
  row.querySelector('.more').addEventListener('click', e => { e.stopPropagation(); openMenu(code, e.currentTarget); });
  setupDrag(row);
  return row;
}

function updateRowValues() {
  for (const row of $rows.querySelectorAll('.row')) {
    const c = row.dataset.code;
    row.querySelector('.val b').textContent = fmt(valueOf(c));
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────
function makeMain(code) {
  if (code === S.active) return;
  const v = rawValue(code);
  S.active = code;
  S.amount = v === null ? 1 : parseFloat(fmt(v, Math.max(S.decimals, 2)).replace(/,/g, '')) || v;
  save('active', 'amount');
  render();
  $big.focus();
  $big.select();
}

function cycleMain(dir) {
  const i = S.list.indexOf(S.active);
  const next = S.list[(i + dir + S.list.length) % S.list.length];
  makeMain(next);
}

function removeCurrency(code) {
  if (S.list.length <= 2) return;
  S.list = S.list.filter(c => c !== code);
  if (S.home === code) S.home = S.list[0];
  save('list', 'home');
  render();
}

function addCurrency(code, asMain) {
  if (!S.list.includes(code)) { S.list.push(code); save('list'); }
  closePicker();
  if (asMain) makeMain(code); else { renderRows(); toast(t('tAdded', code)); }
}

// ── Big input ────────────────────────────────────────────────────────────────
$big.addEventListener('input', () => {
  const v = parseAmount($big.value);
  $big.classList.toggle('bad', $big.value.trim() !== '' && v === null);
  fitBig();
  if (v === null) return;
  S.amount = v;
  updateRowValues();
  save('amount');
});
$big.addEventListener('blur', () => { $big.classList.remove('bad'); $big.value = fmt(S.amount); fitBig(); });
$big.addEventListener('focus', () => {
  const before = $big.value;
  requestAnimationFrame(() => { if ($big.value === before) $big.select(); }); // don't clobber fast typing
});
$big.addEventListener('keydown', e => {
  if (e.key === 'Enter') { $big.value = fmt(S.amount); fitBig(); $big.select(); }
});

// ── Row menu ─────────────────────────────────────────────────────────────────
function openMenu(code, anchor) {
  const m = $('menu');
  document.querySelectorAll('.more.open').forEach(b => b.classList.remove('open'));
  anchor.classList.add('open');
  m.innerHTML = `
    <button data-a="main">${t('mMain')}</button>
    <button data-a="home" ${code === S.home ? 'disabled' : ''}>${t('mHome')}</button>
    <button data-a="copy">${t('mCopy')}</button>
    <button data-a="top" ${S.list[0] === code ? 'disabled' : ''}>${t('mTop')}</button>
    <hr>
    <button data-a="remove" class="danger" ${S.list.length <= 2 ? 'disabled' : ''}>${t('mRemove')}</button>`;
  m.hidden = false;
  const app = $('app').getBoundingClientRect(), r = anchor.getBoundingClientRect();
  let top = r.bottom - app.top + 4;
  if (top + m.offsetHeight > app.height - 6) top = r.top - app.top - m.offsetHeight - 4;
  m.style.top = `${top}px`;
  m.style.right = `${app.right - r.right}px`;
  m.onclick = e => {
    const a = e.target.dataset.a;
    if (!a || e.target.disabled) return;
    closeMenu();
    if (a === 'main') makeMain(code);
    if (a === 'home') { S.home = code; save('home'); renderRateLine(); toast(t('tHome', code)); }
    if (a === 'copy') copy(fmt(valueOf(code)).replace(/,/g, ''), `${t('tCopied')} · ${code}`);
    if (a === 'top') { S.list = [code, ...S.list.filter(c => c !== code)]; save('list'); renderRows(); }
    if (a === 'remove') removeCurrency(code);
  };
}
function closeMenu() {
  $('menu').hidden = true;
  document.querySelectorAll('.more.open').forEach(b => b.classList.remove('open'));
}
document.addEventListener('click', e => { if (!$('menu').contains(e.target) && !e.target.closest('.more')) closeMenu(); });

// ── Drag ─────────────────────────────────────────────────────────────────────
let dragCode = null;
function setupDrag(row) {
  row.addEventListener('dragstart', e => {
    dragCode = row.dataset.code; row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragCode);
  });
  row.addEventListener('dragend', () => {
    row.classList.remove('dragging'); dragCode = null;
    $rows.querySelectorAll('.row').forEach(r => r.classList.remove('drop-before', 'drop-after'));
  });
  row.addEventListener('dragover', e => {
    if (!dragCode || dragCode === row.dataset.code) return;
    e.preventDefault();
    const b = row.getBoundingClientRect(), after = e.clientY > b.top + b.height / 2;
    row.classList.toggle('drop-after', after); row.classList.toggle('drop-before', !after);
  });
  row.addEventListener('dragleave', () => row.classList.remove('drop-before', 'drop-after'));
  row.addEventListener('drop', e => {
    e.preventDefault();
    const target = row.dataset.code;
    if (!dragCode || dragCode === target) return;
    const after = row.classList.contains('drop-after');
    const list = S.list.filter(c => c !== dragCode);
    list.splice(list.indexOf(target) + (after ? 1 : 0), 0, dragCode);
    S.list = list; save('list'); renderRows();
  });
}

// ── Picker ───────────────────────────────────────────────────────────────────
let pickMode = 'add', pickIdx = 0;
function openPicker(mode) {
  pickMode = mode; pickIdx = 0;
  $('picker-sub').textContent = t(mode === 'main' ? 'pickMain' : 'pickAdd');
  $('picker-search').value = '';
  $('picker').hidden = false;
  renderPicker();
  $('picker-search').focus();
}
function closePicker() { $('picker').hidden = true; }

function pickerItems() {
  const q = $('picker-search').value.trim().toLowerCase();
  let codes = Object.keys(CURRENCIES).filter(c => rate(c));
  if (pickMode === 'add') codes = codes.filter(c => !S.list.includes(c));
  else codes = [...S.list.filter(c => rate(c)), ...codes.filter(c => !S.list.includes(c))];
  return codes.filter(c => !q || c.toLowerCase().includes(q)
    || currencyName(c).toLowerCase().includes(q) || (CURRENCIES[c][1] || '').toLowerCase().includes(q));
}

function renderPicker() {
  const items = pickerItems();
  pickIdx = Math.min(pickIdx, Math.max(items.length - 1, 0));
  const hr = rate(S.home);
  $('picker-list').innerHTML = items.length ? items.map((c, i) => `
    <button class="pick${i === pickIdx ? ' kb' : ''}" data-c="${c}">
      ${flagHTML(c)}
      <div class="cn"><b>${c}</b><small>${currencyName(c)}</small></div>
      <div class="r">${c === S.home || !hr ? '' : `${fmtRate(rate(c) / hr)} ${sym(S.home)}`}
        ${pickMode === 'main' && S.list.includes(c) ? `<div class="in">${c === S.active ? '●' : '✓'}</div>` : ''}</div>
    </button>`).join('') : `<div class="nothing">${t('nothing')}</div>`;
}
function scrollKb() { const el = $('picker-list').querySelector('.kb'); if (el) el.scrollIntoView({ block: 'nearest' }); }

$('picker-search').addEventListener('input', () => { pickIdx = 0; renderPicker(); });
$('picker-search').addEventListener('keydown', e => {
  const items = pickerItems();
  if (e.key === 'ArrowDown') { e.preventDefault(); pickIdx = Math.min(pickIdx + 1, items.length - 1); renderPicker(); scrollKb(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); pickIdx = Math.max(pickIdx - 1, 0); renderPicker(); scrollKb(); }
  if (e.key === 'Enter' && items[pickIdx]) addCurrency(items[pickIdx], pickMode === 'main');
});
$('picker-list').addEventListener('click', e => {
  const b = e.target.closest('.pick');
  if (b) addCurrency(b.dataset.c, pickMode === 'main');
});

// ── Settings ─────────────────────────────────────────────────────────────────
function openSettings() { syncSettings(); $('settings').hidden = false; }
function syncSettings() {
  const on = (id, v) => $(id).querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  on('seg-lang', S.lang); on('seg-source', S.source); on('seg-dec', S.decimals);
  $('src-hint').textContent = t(S.source === 'nbu' ? 'srcNbuHint' : 'srcMarketHint');
}
async function setSource(src) {
  if (src === S.source) return;
  S.source = src; save('source');
  const k = `rates_${src}`;
  S.data = (await chrome.storage.local.get(k))[k] || null;
  S.online = null;
  syncSettings(); render(); refresh(false);
}
$('seg-source').addEventListener('click', e => { if (e.target.dataset.v) setSource(e.target.dataset.v); });
$('seg-dec').addEventListener('click', e => {
  if (e.target.dataset.v === undefined) return;
  S.decimals = +e.target.dataset.v; save('decimals'); syncSettings(); render();
});
$('seg-lang').addEventListener('click', e => {
  if (!e.target.dataset.v) return;
  S.lang = LANG = e.target.dataset.v; save('lang');
  applyI18n(); syncSettings(); render();
});
$('btn-reset-list').addEventListener('click', () => {
  Object.assign(S, { list: [...DEFAULT_LIST], active: 'USD', amount: 100, home: 'UAH' });
  save('list', 'active', 'amount', 'home'); render(); toast(t('tReset'));
});

// ── Theme / fee / misc ───────────────────────────────────────────────────────
function applyTheme() {
  const dark = S.theme ? S.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('btn-theme').innerHTML = dark ? I.sun : I.moon;
}
function syncFee() { $('fee-wrap').classList.toggle('on', !!S.markup); }

async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || t('tCopied')); }
  catch { toast(t('tCopyFail')); }
}
let toastT;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 1500);
}

// ── Wiring ───────────────────────────────────────────────────────────────────
$('btn-theme').addEventListener('click', () => {
  S.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  save('theme'); applyTheme();
});
$('btn-refresh').addEventListener('click', () => refresh(true));
$('btn-settings').addEventListener('click', () => ($('settings').hidden ? openSettings() : ($('settings').hidden = true)));
$('settings-close').addEventListener('click', () => { $('settings').hidden = true; });
$('pill').addEventListener('click', () => openPicker('main'));
$('btn-add').addEventListener('click', () => openPicker('add'));
$('picker-close').addEventListener('click', closePicker);
$('src-label').addEventListener('click', () => setSource(S.source === 'nbu' ? 'market' : 'nbu'));
$('btn-copy-all').addEventListener('click', () => {
  const lines = S.list.map(c => `${fmt(valueOf(c))} ${c}`);
  if (S.markup) lines.push(`(${t('tFee', S.markup)})`);
  copy(lines.join('\n'), t('tAllCopied'));
});
$('fee').addEventListener('input', e => {
  const v = parseFloat(e.target.value.replace(',', '.'));
  S.markup = isFinite(v) ? v : 0;
  e.target.style.width = `${Math.max(2, e.target.value.length) * 9 + 4}px`;
  syncFee(); save('markup'); updateRowValues();
});
$('fee').addEventListener('focus', e => e.target.select());

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('menu').hidden) { closeMenu(); return; }
    if (!$('picker').hidden) { e.preventDefault(); closePicker(); return; }
    if (!$('settings').hidden) { e.preventDefault(); $('settings').hidden = true; return; }
  }
  const panelsOpen = !$('picker').hidden || !$('settings').hidden;
  if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !panelsOpen) {
    e.preventDefault(); cycleMain(e.key === 'ArrowDown' ? 1 : -1); return;
  }
  // start typing anywhere → goes to the big field
  const tag = document.activeElement && document.activeElement.tagName;
  if (!panelsOpen && tag !== 'INPUT' && /^[\d.,(]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    $big.focus(); $big.value = ''; // the key itself lands in the field
  }
});

init();
