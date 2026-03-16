# LILA BLACK – Player Journey Visualization Tool

A web-based analytics tool for LILA BLACK game telemetry. Visualizes player movement paths, kill/death events, loot pickups, storm deaths, and heatmaps on interactive minimaps.

**Live URL:** _(https://lila-black-viz.vercel.app/)_

---

## Features

- 🗺️ **Minimap Rendering** — All 3 maps (Ambrose Valley, Grand Rift, Lockdown) with correct world→pixel coordinate mapping
- 👤 **Human vs Bot distinction** — separate color paths (teal = human, orange = bot)
- ⚔️ **Event Markers** — Kill (diamond), Death (X), Storm Death (triangle), Loot (circle)
- 🔥 **Heatmap Overlays** — Kill zones, Death zones, Traffic, Loot zones with opacity control
- 🎮 **Timeline Playback** — Watch a match unfold progressively with play/pause/speed controls
- 🔍 **Zoom & Pan** — Scroll to zoom, drag to pan on the minimap
- 🧰 **Filters** — By map, date (Feb 10–14), match, player type, event type

---

## Running Locally

### Requirements
- **Python 3.8+** with `pyarrow` and `pandas`
- **Node.js 18+**
- Player data at: `C:\Users\user\Downloads\player_data\player_data` (adjust path in `scripts/preprocess.py`)

### Setup

```bash
# 1. Install npm deps
npm install

# 2. Install Python deps
pip install pyarrow pandas

# 3. Run preprocessing (converts parquet → JSON, ~2-3 minutes)
python scripts/preprocess.py

# 4. Start dev server
npx vite --host
# → http://localhost:5173
```

### Production Build

```bash
npx vite build
# Output in dist/
```

---

## Project Structure

```
lila-black-viz/
├── public/
│   ├── minimaps/          # AmbroseValley, GrandRift, Lockdown images
│   └── data/
│       ├── matches_index.json     # Match manifest
│       ├── matches/{id}.json      # Per-match event data
│       └── heatmaps/{map}.json    # Pre-computed heatmap grids
├── scripts/
│   └── preprocess.py      # Parquet → JSON data pipeline
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── components/
│       ├── FilterPanel.jsx   # Sidebar filters
│       ├── MapViewer.jsx     # Canvas-based map renderer
│       └── Timeline.jsx      # Playback controls
├── ARCHITECTURE.md
├── INSIGHTS.md
└── vite.config.js
```

---

## Data Notes

- All parquet files have no `.parquet` extension — pyarrow handles this natively
- `event` column is stored as bytes and decoded to string in preprocessing
- Bot detection: numeric `user_id` = bot, UUID `user_id` = human
- Timestamps are sub-second telemetry snapshots (see ARCHITECTURE.md)

---

## Deployment

Deploy the `dist/` folder after `npx vite build` to any static host:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=dist`
