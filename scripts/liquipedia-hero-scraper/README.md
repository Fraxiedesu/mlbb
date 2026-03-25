# Liquipedia Hero Scraper

Standalone Node scraper for Mobile Legends hero pages only.

## Run

```powershell
node scripts/liquipedia-hero-scraper/cli.mjs --mode parsed --out scripts/liquipedia-hero-scraper/out/heroes.parsed.json
```

## Modes

- `--mode parsed` emits a scaffolded JSON object for each hero.
- `--mode raw` emits a raw manifest with fetch metadata and page summaries.

## Useful flags

- `--portal` overrides the hero portal URL.
- `--base-url` overrides the Liquipedia base URL.
- `--limit` restricts the scrape to the first N heroes for testing.
- `--concurrency` controls parallel page fetches.
- `--compact` writes minified JSON.

## Notes

- The scraper uses a browser-like `User-Agent` and fetches the portal page first to discover hero URLs.
- Item pages are intentionally out of scope for this utility.
