'use strict';

const STRINGS = {
  en: {
    brand: 'Converter',
    theme: 'Toggle theme', refresh: 'Refresh rates', settings: 'Settings', close: 'Close',
    changeMain: 'Change main currency',
    fee: '% fee', feeHint: 'Markup or card fee added to converted values',
    add: '+ Add currency',
    switchSource: 'Click to switch rate source',
    copyAll: 'Copy all', support: '♥ Support', supportHint: 'Buy the author a coffee on Donatello',
    search: 'Search currency…',
    pickAdd: 'Add to list', pickMain: 'Choose main currency',
    nothing: 'Nothing found',
    language: 'Language', source: 'Rate source', decimals: 'Decimals', tips: 'Tips',
    srcMarketShort: 'Mid-market', srcNbuShort: 'NBU official',
    srcMarket: 'Mid-market rate', srcNbu: 'NBU official rate',
    srcMarketHint: 'Aggregated market mid rate, refreshed every 5 minutes.',
    srcNbuHint: 'Official National Bank of Ukraine rate, set once per business day.',
    tip1: 'Click any row to make it the main amount',
    tip2: 'Math works in the big field: <code>250*3+40</code>, <code>1.5k</code>',
    tip3: 'Drag a row to reorder · <kbd>Alt</kbd>+<kbd>↑</kbd><kbd>↓</kbd> moves the main currency',
    tip4: 'Open the popup with <kbd>Alt</kbd>+<kbd>W</kbd>',
    resetList: 'Reset currency list',
    loading: 'Loading rates…', offline: 'Offline · cached rates', noRates: 'Offline · no rates yet',
    perOne: 'per',
    mHome: 'Set as home currency', mMain: 'Make main', mCopy: 'Copy value', mTop: 'Move to top', mRemove: 'Remove',
    tHome: 'Home currency: {0}', tCopied: 'Copied', tAllCopied: 'All values copied', tAdded: '{0} added',
    tReset: 'List reset', tCopyFail: 'Copy failed', tFee: 'fee {0}%',
    noRate: 'No rate from this source',
    today: '', ago: '{0} ago',
  },
  uk: {
    brand: 'Конвертер',
    theme: 'Змінити тему', refresh: 'Оновити курси', settings: 'Налаштування', close: 'Закрити',
    changeMain: 'Змінити основну валюту',
    fee: '% комісія', feeHint: 'Націнка або комісія картки, що додається до перерахованих сум',
    add: '+ Додати валюту',
    switchSource: 'Натисни, щоб змінити джерело курсу',
    copyAll: 'Копіювати все', support: '♥ Підтримати', supportHint: 'Підтримати автора на Donatello',
    search: 'Пошук валюти…',
    pickAdd: 'Додати до списку', pickMain: 'Обрати основну валюту',
    nothing: 'Нічого не знайдено',
    language: 'Мова', source: 'Джерело курсу', decimals: 'Знаків після коми', tips: 'Підказки',
    srcMarketShort: 'Ринковий', srcNbuShort: 'НБУ',
    srcMarket: 'Ринковий курс', srcNbu: 'Офіційний курс НБУ',
    srcMarketHint: 'Середній ринковий курс з кількох джерел, оновлюється кожні 5 хвилин.',
    srcNbuHint: 'Офіційний курс Національного банку України, встановлюється раз на робочий день.',
    tip1: 'Клікни по рядку, щоб зробити його основною сумою',
    tip2: 'У великому полі працює математика: <code>250*3+40</code>, <code>1.5k</code>',
    tip3: 'Перетягуй рядки, щоб змінити порядок · <kbd>Alt</kbd>+<kbd>↑</kbd><kbd>↓</kbd> змінює основну валюту',
    tip4: 'Відкрити вікно: <kbd>Alt</kbd>+<kbd>W</kbd>',
    resetList: 'Скинути список валют',
    loading: 'Завантаження курсів…', offline: 'Офлайн · збережені курси', noRates: 'Офлайн · курсів ще немає',
    perOne: 'за',
    mHome: 'Зробити домашньою', mMain: 'Зробити основною', mCopy: 'Копіювати суму', mTop: 'Підняти вгору', mRemove: 'Видалити',
    tHome: 'Домашня валюта: {0}', tCopied: 'Скопійовано', tAllCopied: 'Усі суми скопійовано', tAdded: '{0} додано',
    tReset: 'Список скинуто', tCopyFail: 'Не вдалося скопіювати', tFee: 'комісія {0}%',
    noRate: 'Це джерело не має курсу для валюти',
    today: '', ago: '{0} тому',
  },
};

const NAMES_UK = {
  UAH: 'Українська гривня', USD: 'Долар США', EUR: 'Євро', PLN: 'Польський злотий',
  GBP: 'Британський фунт', CHF: 'Швейцарський франк', CZK: 'Чеська крона', HUF: 'Угорський форинт',
  RON: 'Румунський лей', BGN: 'Болгарський лев', MDL: 'Молдовський лей', SEK: 'Шведська крона',
  NOK: 'Норвезька крона', DKK: 'Данська крона', ISK: 'Ісландська крона', RSD: 'Сербський динар',
  TRY: 'Турецька ліра', GEL: 'Грузинський ларі', AMD: 'Вірменський драм', AZN: 'Азербайджанський манат',
  KZT: 'Казахстанський тенге', UZS: 'Узбецький сум', CAD: 'Канадський долар', AUD: 'Австралійський долар',
  NZD: 'Новозеландський долар', JPY: 'Японська єна', CNY: 'Китайський юань', HKD: 'Гонконгський долар',
  TWD: 'Тайванський долар', KRW: 'Південнокорейська вона', SGD: 'Сінгапурський долар', THB: 'Тайський бат',
  VND: 'Вʼєтнамський донг', IDR: 'Індонезійська рупія', MYR: 'Малайзійський ринггіт', PHP: 'Філіппінське песо',
  INR: 'Індійська рупія', PKR: 'Пакистанська рупія', BDT: 'Бангладеська така', LKR: 'Шрі-ланкійська рупія',
  ILS: 'Ізраїльський шекель', AED: 'Дирхам ОАЕ', SAR: 'Саудівський ріял', QAR: 'Катарський ріял',
  EGP: 'Єгипетський фунт', MAD: 'Марокканський дирхам', TND: 'Туніський динар', ZAR: 'Південноафриканський ранд',
  NGN: 'Нігерійська найра', KES: 'Кенійський шилінг', MXN: 'Мексиканське песо', BRL: 'Бразильський реал',
  ARS: 'Аргентинське песо', CLP: 'Чилійське песо', COP: 'Колумбійське песо', PEN: 'Перуанський соль',
  XAU: 'Золото (тр. унція)', XAG: 'Срібло (тр. унція)', BTC: 'Біткоїн', ETH: 'Ефір', USDT: 'Tether',
};

let LANG = 'en';
function t(key, ...args) {
  let s = (STRINGS[LANG] && STRINGS[LANG][key]) ?? STRINGS.en[key] ?? key;
  args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
  return s;
}
function currencyName(code) {
  if (LANG === 'uk' && NAMES_UK[code]) return NAMES_UK[code];
  return (CURRENCIES[code] && CURRENCIES[code][1]) || code;
}
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}
