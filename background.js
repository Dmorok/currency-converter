'use strict';

// Rates are always normalised to: rates[CODE] = how many UAH 1 unit of CODE costs.
//   nbu    → official National Bank of Ukraine rate (updated once a business day)
//   market → aggregated mid-market rate (several free public feeds, first that answers wins)

const REFRESH_MINUTES = 5;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('refresh', { periodInMinutes: REFRESH_MINUTES });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('refresh', { periodInMinutes: REFRESH_MINUTES });
});

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== 'refresh') return;
  const { source = 'market' } = await chrome.storage.local.get('source');
  try { await getRates(source, true); } catch (_) { /* stay on cache */ }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_RATES') {
    getRates(msg.source, msg.force)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function getRates(source, force) {
  const key = `rates_${source}`;
  const cached = (await chrome.storage.local.get(key))[key];
  if (!force && cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return cached;

  const data = source === 'nbu' ? await fetchNBU() : await fetchMarket();
  data.fetchedAt = Date.now();
  await chrome.storage.local.set({ [key]: data });
  return data;
}

async function getJSON(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// ── NBU ──────────────────────────────────────────────────────────────────────
async function fetchNBU() {
  const json = await getJSON('https://bank.gov.ua/NBUStatService/v1/statdatawebapi/NBUExchangeRate?json');
  const rates = { UAH: 1 };
  let date = null;
  for (const it of json) {
    if (it.cc && it.rate > 0) rates[it.cc] = it.rate;
    if (!date && it.exchangedate) date = it.exchangedate; // dd.mm.yyyy
  }
  if (!rates.USD) throw new Error('NBU: empty response');
  return { source: 'nbu', rates, rateDate: date };
}

// ── Market mid-rate ──────────────────────────────────────────────────────────
async function fetchMarket() {
  const errors = [];

  // 0: MoneyConvert CDN — same feed Currency Converter Pro (currencyrate.today) uses.
  //    base USD, rates[x] = x per 1 USD, refreshed every few minutes.
  try {
    const j = await getJSON('https://cdn.moneyconvert.net/api/latest.json');
    const uahPerUsd = j.rates && j.rates.UAH;
    if (uahPerUsd > 0) {
      const rates = { UAH: 1 };
      for (const [k, v] of Object.entries(j.rates)) {
        if (v > 0 && /^[A-Z]{3,4}$/.test(k)) rates[k] = uahPerUsd / v;
      }
      rates.UAH = 1;
      rates.USD = uahPerUsd; // base currency may be absent from the map
      const ts = j.timestamp ? (j.timestamp < 1e12 ? j.timestamp * 1000 : j.timestamp) : Date.now();
      return { source: 'market', rates, rateDate: new Date(ts).toISOString().slice(0, 16).replace('T', ' ') + ' UTC', provider: 'MoneyConvert' };
    }
  } catch (e) { errors.push(e.message); }

  // 1–2: fawazahmed0 currency-api (jsDelivr + Cloudflare mirror). uah[x] = x per 1 UAH
  for (const url of [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/uah.min.json',
    'https://latest.currency-api.pages.dev/v1/currencies/uah.min.json',
  ]) {
    try {
      const j = await getJSON(url);
      const rates = invert(j.uah);
      if (rates.USD) return { source: 'market', rates, rateDate: j.date };
    } catch (e) { errors.push(e.message); }
  }

  // 3: open.er-api.com. rates[x] = x per 1 UAH
  try {
    const j = await getJSON('https://open.er-api.com/v6/latest/UAH');
    const rates = invert(j.rates);
    if (rates.USD) {
      return { source: 'market', rates, rateDate: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10) };
    }
  } catch (e) { errors.push(e.message); }

  throw new Error('Market feeds unavailable');
}

function invert(perUah) {
  const rates = { UAH: 1 };
  for (const [k, v] of Object.entries(perUah || {})) {
    const code = k.toUpperCase();
    if (v > 0 && /^[A-Z]{3,4}$/.test(code)) rates[code] = 1 / v;
  }
  return rates;
}
