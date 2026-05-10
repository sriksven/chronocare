# ChronoCare logo assets

Drop these into the Prompt Opinion Marketplace publisher profile, the GitHub repo header, or anywhere a brand mark is needed.

## Files

| File | Format | Size | Use for |
|---|---|---|---|
| `logo.svg` | SVG | 512×512 | Master icon, vector, scales infinitely |
| `logo-1024.png` | PNG | 1024×1024 | High-res marketplace listings, social cards |
| `logo-512.png` | PNG | 512×512 | Standard marketplace tile, app icon |
| `logo-256.png` | PNG | 256×256 | Smaller listings, favicons |
| `logo-wordmark.svg` | SVG | 1280×320 | Wordmark with tagline, vector |
| `logo-wordmark.png` | PNG | 1280×320 | README banner, presentation slides |

## Design

- **Background:** deep teal `#0f3a44`, rounded corners
- **Foreground:** cream `#f8f6f1` trajectory line rising from lower-left to upper-right
- **Three turning points** in clinical tone colors:
  - `#1a5762` (teal — early, low-risk event)
  - `#a86c14` (amber — mid, watch-list event)
  - `#9c2f2f` (crimson — recent, escalating event)
- **Dashed vertical line** on the right marks "today" — the present moment that frames the timeline
- **Subtle year-tick grid** behind the trajectory

The mark reads as both a clinical waveform and a multi-year patient trajectory. The escalating colors of the turning points telegraph the early-warning story without any text.

## Brand pairing

Use the icon on cream backgrounds (`#f8f6f1`) for the cleanest contrast. Avoid placing it on busy or low-contrast backgrounds.

## Regenerating PNGs from SVG

The PNGs in this folder were generated from `logo.svg` using macOS's built-in `sips`:

```bash
cd docs
sips -s format png logo.svg --out logo-512.png
sips -z 256 256 logo-512.png --out logo-256.png
sips -z 1024 1024 logo-512.png --out logo-1024.png
sips -s format png logo-wordmark.svg --out logo-wordmark.png
```

Re-run after editing the SVGs.

## Where it's used

- **Marketplace publisher profile**: upload `logo-512.png`
- **Per-listing logo** (ChronoCare MCP Server, ChronoCore agent): upload `logo-512.png`
- **README banner**: embed `logo-wordmark.png`
- **Frontend favicon**: a simpler version is at `frontend/public/favicon.svg`
