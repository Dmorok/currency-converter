# Changelog

## 3.0.1 — 2026-10-03

- Chrome Web Store ready: localized name and description (en, uk), store graphics in `store/`
- Removed the unnecessary `clipboardWrite` permission (copying still works)
- Store-compliant 128 px icon (16 px transparent padding)
- Fixed: typing right after clicking the amount no longer gets replaced by the auto-select
- Fixed: empty strip under the footer
- `build.ps1` now writes forward-slash zip paths

## 3.0.0 — 2026-10-03

First public release.

- New UI: one main amount at the top, all other currencies listed below it
- Mid-market rates refreshed every 5 minutes, with two fallback providers
- Official NBU rate as an alternative source
- Math expressions in the amount field
- Fee / markup percentage
- English and Ukrainian interface
- Light and dark theme
- Bundled SVG flags and Onest font, so the popup works fully offline with cached rates
- Keyboard shortcuts: <kbd>Alt</kbd>+<kbd>W</kbd>, <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>, type-to-focus
