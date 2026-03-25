# Liquipedia Item Scraper

Standalone Node scraper for Mobile Legends equipment pages.

## Run

```powershell
node scripts/liquipedia-item-scraper/cli.mjs --mode parsed --out scripts/liquipedia-item-scraper/out/items.parsed.json
```

## Modes

- `--mode parsed` emits a scaffolded JSON object for each item.
- `--mode raw` emits a raw manifest with fetch metadata and page summaries.

## Useful flags

- `--portal` overrides the equipment portal URL.
- `--base-url` overrides the Liquipedia base URL.
- `--limit` restricts the scrape to the first N items for testing.
- `--concurrency` controls parallel page fetches.
- `--compact` writes minified JSON.

## Notes

- The scraper uses a browser-like `User-Agent` and fetches the portal page first to discover item URLs.
- Category detection is derived from the equipment portal section headers, then refined by the item page infobox where available.
