# The Budget Audiophile

A curated, searchable field guide to the best-value audiophile gear — IEMs, headphones, DACs & amps, players, speakers and turntables — with editorial ratings, reviews, sound-signature profiles, "pairs well with" synergy and where to buy.

**Live demo:** _(Vercel URL)_

## Highlights

- **Faceted database** — search, category, price, sound-signature and *best-for-music genre* filters, with live counts and a collapsible filter rail. Category-specific facets adapt to the selected type (driver, design, form factor…).
- **Gallery & list views** — the list view is a "departures board" with the top pick in each category highlighted as a dark block.
- **Detail view** — dotted rating gauge, tuning-profile bars, genre fit, "pairs well with" recommendations, glossary tooltips, retailers and community notes.
- **Compare mode** — pick up to three pieces and compare side by side.
- **Starter systems** — curated budget bundles (a source + a transducer that sing together).
- **Editor's picks**, a warm "field guide meets measurement lab" aesthetic, dark "night-listening" mode, shareable deep links, and full mobile responsiveness.

## Tech

Plain HTML, CSS and vanilla JavaScript — no build step, no dependencies. All product imagery is self-hosted in `assets/`.

- `index.html` — structure
- `styles.css` — the "Listening Room" design system
- `app.js` — catalog logic (faceting, views, modal, compare, theme, deep links)
- `data.js` — the curated catalogue

## Run locally

Any static server, e.g.:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

---

A demo project. Ratings, prices and community notes are illustrative; verify current prices before buying.
