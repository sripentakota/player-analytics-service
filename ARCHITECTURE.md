# LILA BLACK — Player Journey Visualization Tool

---

## 1. What You Built With and Why You Picked It

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Data pipeline** | Python (pyarrow + pandas) | Strong parquet support; one-time preprocessing at build time; no need for a runtime backend. |
| **Frontend** | React + Vite | Fast dev loop, component model fits filter-heavy UI; Vite gives quick HMR and small production bundles. |
| **Rendering** | HTML5 Canvas | ~89K data points (paths + events) need high-performance drawing; DOM-based markers would not scale. |
| **Styling** | Vanilla CSS + custom properties | No UI framework; full control over layout and glassmorphism-style panels. |
| **Deployment** | Vercel / Netlify (static) | Data is pre-processed to JSON at build time — no server or API required; simple static deploy. |

**Summary:** The stack is chosen for **speed of load** (precomputed JSON), **smooth interaction** (Canvas for many points), and **simple hosting** (static site only).

---

## 2. How Data Flows From Parquet Files to What Shows on Screen

**End-to-end flow:** `raw parquet` → `Python preprocessing` → `static JSON` → `React app` → `Canvas`.

### 2.1 High-level data flow
![High-level data flow](/docs/architecture/image3.png)

### 2.2 Detailed pipeline steps
1.  **Raw input:** Parquet files (no `.parquet` extension) under date folders (e.g. `February_10` … `February_14`). Each row has: `match_id`, `map_id`, `user_id`, `x`, `z`, `y`, `ts`, `event`.
2.  **Preprocess (Python):**
    - Read all parquet files with pyarrow.
    - Decode `event` from bytes to string.
    - Mark bots (numeric `user_id`) vs humans (UUID).
    - Convert world `(x, z)` to minimap pixel `(px_x, px_y)` using map-specific scale and origin.
    - Normalize `ts` to match-relative milliseconds (`ts_rel`).
    - Group by match; write one JSON per match under `public/data/matches/{short_id}.json`.
    - Build `matches_index.json` (map, date, match id, player counts, duration).
    - Optionally pre-compute 64×64 heatmap grids per map → `public/data/heatmaps/{MapId}.json`.

### 2.3 Detailed Steps
![Detailed pipeline steps](/docs/architecture/image1.png)

---

## 3. How Game Coordinates Were Mapped to the Minimap

This is the critical part: **world space (game engine) → 1024×1024 minimap image**.

### 3.1 Formula
1. Minimap image size: **1024×1024** pixels.
2. Each map has a **scale** and **origin (origin_x, origin_z)**.
3. World axes: **x**, **z** (horizontal plane); **y** is elevation and not used for 2D minimap.

**Normalized coordinates (0–1):**
- `u = (world_x - origin_x) / scale`
- `v = (world_z - origin_z) / scale`

**Pixel coordinates (0–1024):**
- `pixel_x = u * 1024`
- `pixel_y = (1 - v) * 1024`

The `(1 - v)` flips the vertical axis because image origin is top-left while the game world often has Z increasing in the opposite direction.

### 3.2 Map config
| Map | Scale | Origin X | Origin Z |
| :--- | :--- | :--- | :--- |
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

### 3.3 Coordinate mapping flow
![Coordinate mapping flow](/docs/architecture/image2.png)

### 3.4 Verification
For **AmbroseValley**: world `(-301.45, -355.55)` → pixel `(78.0, 890.4)`.  
Implementation in `scripts/preprocess.py` uses the same formula and rounds to one decimal; this was checked during development to confirm alignment with the minimap.

### 3.5 In the frontend
Preprocessing already writes **pixel** coordinates (`px_x`, `px_y`) into the match JSON. The Canvas uses a fixed internal size (e.g. 700×700) and scales those pixel coords by `CANVAS_SIZE / 1024` when drawing, so no coordinate math is done in the browser — only scaling and zoom/pan transforms.

---

## 4. Assumptions When the Data Was Ambiguous

| What was ambiguous | Assumption / handling |
| :--- | :--- |
| **Timestamp semantics** | Treated as absolute ms and **normalized per match** by subtracting the minimum timestamp in that match so that playback is 0–duration_ms. |
| **Bot vs human** | numeric `user_id` = bot, UUID = human. We used **regex** `^\d+$` on `user_id` to classify; any all-numeric id is treated as bot. |
| **February 14 partial data** | **Included all available dates**; no special handling. Missing folders are skipped with a warning. |
| **Parquet file extension** | Files had no `.parquet` extension. We **passed paths directly** to `pyarrow.parquet.read_table()`; no renaming. |
| **Event column type** | `event` could be bytes. We **decode to UTF-8 string** when needed and handle non-bytes by casting to string. |
| **match_id suffix** | Some IDs had `.nakama-0`. We **strip that** for grouping and use a short hash for filenames. |

---

## 5. Major Trade-offs

| Decision | Options considered | Choice | Trade-off |
| :--- | :--- | :--- | :--- |
| **Data format for frontend** | Serve parquet + query in browser vs pre-process to JSON | Pre-process to JSON at build time | Fast load, no backend. Reprocess and redeploy when data changes. |
| **Rendering** | SVG/DOM vs Canvas vs WebGL | HTML5 Canvas | Handles ~89K points smoothly. No built-in “click path for tooltip”; would need hit-testing. |
| **Match data granularity** | One big JSON vs one file per match | One JSON per match | Small per-match fetch (~5–20KB). No “all matches on one map” view without extra aggregation. |
| **Heatmap resolution** | 32×32 vs 64×64 vs 128×128 | 64×64 | Good visual smoothness and fast to compute. Very tight clusters can blur. |
| **Heatmap source** | Precomputed global vs per-match in client | Per-match in client (current app) | Heatmap always matches selected match. Slightly more client work. |
| **Timeline playback** | Real-time only vs scrubbable + play | Scrubbable slider + play/pause + speed | Level designers can scrub and replay. Playback uses requestAnimationFrame for smoothness. |
