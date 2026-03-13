# ARCHITECTURE.md

**LILA BLACK — Player Journey Visualization Tool**

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Data pipeline | Python (pyarrow + pandas) | Proven parquet ecosystem; one-time preprocessing at build time |
| Frontend | React + Vite | Fast dev loop, component model ideal for filter-heavy UI; no SSR needed |
| Rendering | HTML5 Canvas | 89K data points require high-performance rendering not feasible with DOM elements |
| Styling | Vanilla CSS with custom properties | Zero dependencies, full control, glassmorphism effects |
| Deployment | Vercel / Netlify (static) | Data pre-processed to JSON at build time — no backend required |

---

## Data Flow

```
Raw Parquet Files (1,243 files, ~89K rows)
  └─► Python scripts/preprocess.py
        ├── Reads all .nakama-0 files via pyarrow
        ├── Decodes event bytes → string
        ├── Detects bots (numeric user_id) vs humans (UUID user_id)
        ├── Maps world (x, z) → minimap pixel using README formula
        ├── Normalizes timestamps to match-relative milliseconds
        ├── Groups events by match_id, outputs one JSON per match
        └── Pre-computes 64×64 heatmap grids per map

public/data/
  ├── matches_index.json       → manifest (map, date, player counts, duration)
  ├── matches/{short_id}.json  → per-match player events with pixel coords
  └── heatmaps/{MapId}.json    → pre-aggregated kill/death/traffic grids

React Frontend (Canvas rendering)
  ├── Loads matches_index.json on startup
  ├── On match select: fetches .json, renders Canvas
  ├── Timeline slider: filters events by ts_rel ≤ position * duration
  └── Heatmap: overlays pre-computed grid on Canvas
```

---

## Coordinate Mapping

Game world coordinates are in a 3D engine space. The minimap is a 1024×1024px top-down image. Mapping uses the formula from the README:

```
u = (world_x - origin_x) / scale
v = (world_z - origin_z) / scale

pixel_x = u * 1024
pixel_y = (1 - v) * 1024     ← Y-flip: image origin is top-left, world Y increases upward
```

**Map configs** (from README):

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

Verified with README example: world (-301.45, -355.55) → pixel (78.0, 890.4) ✓  
**Note:** The `y` column is elevation (height), irrelevant for 2D minimap display.

---

## Assumptions Made

| Ambiguity | Assumption |
|-----------|------------|
| `ts` semantics | README says "time elapsed within the match" but values look like ms-since-epoch. Treated as absolute ms, normalized per-match by subtracting min timestamp. |
| Bot vs human detection | Used filename pattern (numeric prefix = bot) confirmed by README |
| February 14 partial data | Included as-is; no special handling needed since it's just fewer matches |
| No `.parquet` extension | Passed file paths directly to pyarrow which handles it natively |

---

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Pre-process to JSON | ✅ Fast browser load, no backend. ❌ Requires reprocessing if data changes |
| Canvas over SVG/deck.gl | ✅ Handles 89K points smoothly. ❌ No "click a path to see player detail" tooltip (would need hit-testing) |
| One JSON per match | ✅ Fast per-match load (~5–20KB). ❌ Aggregated queries (e.g., "show all matches at once") aren't feasible |
| 64×64 heatmap grid | ✅ Smooth visual, fast computation. ❌ Loses precision for very tight clusters |

---

## With More Time

1. **Hover tooltips** — click on a path to see player ID, event breakdown, K/D ratio
2. **Storm visualization** — animate the shrinking play zone using the KilledByStorm event timestamps to infer storm position over time
3. **Player comparison** — overlay two specific players' journeys side-by-side
4. **Aggregate match view** — render all matches for a map simultaneously as a density visualization
5. **DuckDB in-browser** — replace static JSON with DuckDB WASM to enable ad-hoc SQL queries directly on the parquet files, eliminating the preprocessing step
6. **Loot cluster highlights** — automatically detect and label landmark loot zones
