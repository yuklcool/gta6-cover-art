[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/yuklcool/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/yuklcool/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Nights — GTA-style cover maker

An entry for the [make.fun](https://make.fun) bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01): a web app
that turns any photo and a caption into GTA 6-style cover art — the
multi-panel poster look with bold caption lettering and a Vice City sunset
or neon colour grade — and exports it as a PNG to share.

- **Any photo:** upload your own photos, or use the two built-in samples.
  Each of the three panels (hero + two) takes its own photo, with drag to
  pan and a slider to zoom; one photo can fill all three panels.
- **Fast and easy:** photo → caption → grade → size → PNG, in the common
  post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080.
- **Offline:** static files under `app/`, no build step, no network
  request. Photos are read on your own machine and never uploaded.
- **Original art:** every visual is drawn in code (gradients, palm and
  skyline silhouettes, halftone, synthwave sun). No Rockstar logo,
  wordmark, artwork or font file — the lettering is a system font stack.

## Run it

```sh
node serve.ts   # app/ on http://localhost:8080
```

## Layout

- `app/index.html` — page shell and controls
- `app/style.css` — editor styling
- `app/src/editor.js` — UI wiring: uploads, drag-to-pan, zoom, export
- `app/src/cover.js` — the canvas cover renderer
- `app/src/panels.js` — panel layouts per post size and photo fitting
- `app/src/grades.js` — sunset / neon / vice / noir colour grades
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=`)
- `app/samples/` — two sample photos, made for make.fun with an image
  model and free to use
- `main.ts` — hands the app and screenshots in (writes `dossier.json`)
