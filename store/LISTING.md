# Chrome Web Store — submission kit

Everything you need to copy into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Fields are listed in the order the dashboard asks for them.

---

## 0. One-time setup

1. Register as a developer (one-time $5 fee) and verify your contact email.
2. Turn on 2-Step Verification for the Google account. Publishing requires it.
3. Set the **Publisher name**, e.g. `D.Morok`.

## 1. Package

```powershell
cd "E:\!claude\CurrencyConverter"
powershell -ExecutionPolicy Bypass -File scripts\build.ps1
```

Upload `dist\currency-converter-v3.0.1.zip` via **New item**.

The name and short description are read from the package (`_locales/en`, `_locales/uk`), so the dashboard shows them already filled in.

| Locale | Name (≤75) | Summary (≤132) |
|---|---|---|
| en | UAH Currency Converter — Live & NBU Rates | Convert UAH, USD, EUR and 60+ currencies at once. Live mid-market or official NBU rate, math in the input, EN/UA. |
| uk | Конвертер валют — гривня, ринковий курс і НБУ | Гривня, долар, євро та 60+ валют одночасно. Ринковий або офіційний курс НБУ, математика в полі, укр/англ. |

---

## 2. Store listing tab

**Category:** Tools
**Language:** English (default). Then add **Ukrainian** and paste the Ukrainian description and screenshots there.

### Detailed description — English

```
Type an amount once and instantly see it in all your currencies.

A clean, fast converter for everyday use: shopping abroad, freelance invoices, checking a price in hryvnias, dollars or euros. It is built for Ukraine but works for any currency.

★ WHAT IT DOES
• One big amount at the top, every other currency below. Click any row to make it the main one.
• Two rate sources:
  – Mid-market rate: aggregated market rate, refreshed every 5 minutes
  – NBU official rate: the National Bank of Ukraine rate for the day
• Math right in the field: 250*3+40, 1200/4, 1.5k. Both 1 234,50 and 1,234.50 work.
• Card fee: add +2% (or any markup) to every converted value
• 60+ currencies, including crypto (BTC, ETH, USDT) and gold/silver
• Search currencies by code or name, drag to reorder
• Copy one value or all of them in one click
• Light and dark theme
• English and Ukrainian interface
• Works offline with the last saved rates

★ KEYBOARD
• Alt+W opens the converter
• Just start typing digits, no clicking needed
• Alt+↑ / Alt+↓ switches the main currency

★ PRIVATE BY DESIGN
No accounts, no ads, no analytics, no tracking. The extension only downloads public exchange-rate data. Your settings stay in your browser. Fonts and flags are bundled, so nothing is loaded from third-party sites.

Open source: https://github.com/Dmorok/currency-converter

Rates are for information only. Check with your bank before making a transaction.
```

### Detailed description — Українська

```
Введи суму один раз і одразу побач її в усіх своїх валютах.

Простий і швидкий конвертер на кожен день: покупки за кордоном, рахунки для фрилансу, перевірити ціну в гривнях, доларах чи євро. Створений в Україні, але працює з будь-якими валютами.

★ МОЖЛИВОСТІ
• Одна велика сума зверху, решта валют під нею. Клік по рядку робить його валюту основною.
• Два джерела курсу:
  – Ринковий: середній курс з кількох джерел, оновлюється кожні 5 хвилин
  – Офіційний курс НБУ на поточний день
• Математика прямо в полі: 250*3+40, 1200/4, 1.5k. Працюють і 1 234,50, і 1,234.50.
• Комісія картки: додай +2% (або будь-яку націнку) до всіх перерахованих сум
• 60+ валют, серед них криптовалюти (BTC, ETH, USDT), золото й срібло
• Пошук валют за кодом або назвою, перетягування рядків
• Копіювання однієї суми або всіх одразу
• Світла й темна тема
• Українська та англійська мови інтерфейсу
• Без інтернету працює на останніх збережених курсах

★ КЛАВІАТУРА
• Alt+W відкриває конвертер
• Просто починай набирати цифри, клікати нікуди не треба
• Alt+↑ / Alt+↓ змінює основну валюту

★ ПРИВАТНІСТЬ
Без акаунтів, реклами, аналітики й трекінгу. Розширення завантажує лише публічні курси валют. Налаштування зберігаються у твоєму браузері. Шрифти й прапори вбудовані, нічого не вантажиться зі сторонніх сайтів.

Відкритий код: https://github.com/Dmorok/currency-converter

Курси наведено для довідки. Перед операцією уточнюй курс у своєму банку.
```

### Graphics

| Field | File | Size |
|---|---|---|
| Store icon | `store/store-icon-128.png` | 128×128 (96 px art + 16 px padding) |
| Screenshots (EN) | `store/screenshot-1-en.png` … `screenshot-5-en.png` | 1280×800 |
| Screenshots (UK) | `store/screenshot-1-uk.png` … `screenshot-5-uk.png` | 1280×800 |
| Small promo tile | `store/promo-small-440x280.png` | 440×280 |
| Marquee promo tile | `store/promo-marquee-1400x560.png` | 1400×560 (optional) |

### Additional fields

- **Official URL:** leave empty (it needs a verified domain)
- **Homepage URL:** `https://github.com/Dmorok/currency-converter`
- **Support URL:** `https://github.com/Dmorok/currency-converter/issues`
- **Mature content:** No

---

## 3. Privacy tab

### Single purpose

```
Convert an amount between multiple currencies using current exchange rates (mid-market or the official National Bank of Ukraine rate), shown in the toolbar popup.
```

### Permission justifications

**storage**
```
Saves the user's currency list, chosen main and home currency, last entered amount, settings (language, theme, rate source, decimals, fee %) and the most recently downloaded exchange rates, so the popup opens instantly and works offline. Stored locally with chrome.storage.local; nothing is synced or sent anywhere.
```

**alarms**
```
Schedules a background refresh of exchange rates every 5 minutes, so the rates are current when the user opens the popup.
```

**Host permissions**
```
Used only to download public exchange-rate JSON with plain GET requests:
• bank.gov.ua: official National Bank of Ukraine rates
• cdn.moneyconvert.net: primary mid-market rates
• cdn.jsdelivr.net and latest.currency-api.pages.dev: fallback mid-market rates (open-source currency-api)
• open.er-api.com: second fallback for mid-market rates
No page content is read and no user data is sent to these hosts.
```

### Remote code

**No, I am not using remote code.** All JavaScript ships inside the package. Only JSON data is fetched.

### Data usage

Leave **every** data-type checkbox unchecked (Personally identifiable info, Health, Financial and payment, Authentication, Personal communications, Location, Web history, User activity, Website content).

Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://github.com/Dmorok/currency-converter/blob/main/PRIVACY.md
```

---

## 4. Distribution tab

- **Payments:** Free
- **Visibility:** Public (or Unlisted for a soft launch: only people with the link can find it)
- **Regions:** All regions

## 5. Submit

Click **Submit for review**. With host permissions, the first review usually takes from a few days up to about 2 weeks. Tick "Publish automatically after approval", or publish manually when it is approved.

## Later updates

1. Bump `version` in `manifest.json` and add an entry to `CHANGELOG.md`.
2. Run `scripts\build.ps1`.
3. In the dashboard, open **Package → Upload new package** and submit for review.
