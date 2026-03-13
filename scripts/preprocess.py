"""
Preprocess LILA BLACK parquet data into optimized JSON for the frontend.

Reads all parquet files from the data directory, computes pixel coordinates,
detects bots vs humans, and outputs:
  - public/data/matches_index.json  (match metadata manifest)
  - public/data/matches/{match_id}.json  (per-match event data)
  - public/data/heatmaps/{map_id}.json  (pre-computed heatmap grids)
"""

import os
import sys
import json
import re
import pandas as pd
import pyarrow.parquet as pq
from collections import defaultdict
import hashlib

# Map configurations from README
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900, "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581, "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

MAP_SIZE = 1024  # minimap images are 1024x1024

# Data source directory
DATA_DIR = r"C:\Users\user\Downloads\player_data\player_data"
DATE_FOLDERS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")

def is_bot(user_id: str) -> bool:
    """Bots have numeric user_ids, humans have UUIDs."""
    return bool(re.match(r'^\d+$', str(user_id).strip()))

def world_to_pixel(x: float, z: float, map_id: str) -> tuple:
    """Convert world coordinates to minimap pixel coordinates."""
    config = MAP_CONFIG[map_id]
    u = (x - config["origin_x"]) / config["scale"]
    v = (z - config["origin_z"]) / config["scale"]
    pixel_x = u * MAP_SIZE
    pixel_y = (1 - v) * MAP_SIZE
    return round(pixel_x, 1), round(pixel_y, 1)

def decode_event(val):
    """Decode event column from bytes to string."""
    if isinstance(val, bytes):
        return val.decode('utf-8')
    return str(val)

def short_match_id(match_id: str) -> str:
    """Create a short hash of match_id for filenames."""
    return hashlib.md5(match_id.encode()).hexdigest()[:10]

def load_all_data() -> pd.DataFrame:
    """Load all parquet files into a single DataFrame."""
    frames = []
    total_files = 0
    
    for date_folder in DATE_FOLDERS:
        folder_path = os.path.join(DATA_DIR, date_folder)
        if not os.path.exists(folder_path):
            print(f"  [WARN] Folder not found: {folder_path}")
            continue
        
        file_count = 0
        for filename in os.listdir(folder_path):
            filepath = os.path.join(folder_path, filename)
            if filename.startswith('.'):
                continue
            try:
                table = pq.read_table(filepath)
                df = table.to_pandas()
                df['date'] = date_folder
                df['source_file'] = filename
                frames.append(df)
                file_count += 1
            except Exception as e:
                print(f"  [WARN] Failed to read {filepath}: {e}")
                continue
        
        total_files += file_count
        print(f"  Loaded {file_count} files from {date_folder}")
    
    if not frames:
        print("ERROR: No data loaded!")
        sys.exit(1)
    
    df = pd.concat(frames, ignore_index=True)
    print(f"\n  Total files: {total_files}")
    print(f"  Total rows: {len(df)}")
    return df

def process_data(df: pd.DataFrame) -> pd.DataFrame:
    """Process the raw DataFrame: decode events, compute pixel coords, detect bots."""
    print("\nProcessing data...")
    
    # Decode event column
    df['event'] = df['event'].apply(decode_event)
    
    # Detect bots
    df['is_bot'] = df['user_id'].apply(is_bot)
    
    # Clean match_id (remove .nakama-0 suffix consistently)
    df['match_id_clean'] = df['match_id'].str.replace('.nakama-0', '', regex=False)
    
    # Compute pixel coordinates
    px_x = []
    px_y = []
    for _, row in df.iterrows():
        if row['map_id'] in MAP_CONFIG:
            x, y = world_to_pixel(row['x'], row['z'], row['map_id'])
            px_x.append(x)
            px_y.append(y)
        else:
            px_x.append(None)
            px_y.append(None)
    
    df['px_x'] = px_x
    df['px_y'] = px_y
    
    # Convert timestamp to milliseconds (numeric for sorting/playback)
    # datetime64[ms].astype('int64') already gives ms since epoch — no division needed
    df['ts_ms'] = pd.to_numeric(df['ts'].astype('int64'))
    
    # Normalize ts to be relative within each match (start from 0)
    min_ts = df.groupby('match_id_clean')['ts_ms'].transform('min')
    df['ts_rel'] = df['ts_ms'] - min_ts
    
    # Print stats
    print(f"  Events by type:")
    for event, count in df['event'].value_counts().items():
        print(f"    {event}: {count}")
    print(f"  Maps: {df['map_id'].unique().tolist()}")
    print(f"  Unique matches: {df['match_id_clean'].nunique()}")
    print(f"  Unique players (human): {df[~df['is_bot']]['user_id'].nunique()}")
    print(f"  Bots: {df[df['is_bot']]['user_id'].nunique()}")
    
    # Verify coordinate mapping with README example
    test_x, test_z = -301.45, -355.55
    test_px, test_py = world_to_pixel(test_x, test_z, "AmbroseValley")
    print(f"\n  Coordinate verification (AmbroseValley):")
    print(f"    World ({test_x}, {test_z}) -> Pixel ({test_px}, {test_py})")
    print(f"    Expected: ~(78, 890)")
    
    return df

def generate_match_files(df: pd.DataFrame):
    """Generate per-match JSON files and the matches index."""
    matches_dir = os.path.join(OUTPUT_DIR, "matches")
    os.makedirs(matches_dir, exist_ok=True)
    
    matches_index = []
    
    grouped = df.groupby('match_id_clean')
    total = len(grouped)
    
    for i, (match_id, match_df) in enumerate(grouped):
        if (i + 1) % 100 == 0:
            print(f"  Processing match {i+1}/{total}...")
        
        map_id = match_df['map_id'].iloc[0]
        date = match_df['date'].iloc[0]
        
        # Get unique players in this match
        humans = match_df[~match_df['is_bot']]['user_id'].unique().tolist()
        bots = match_df[match_df['is_bot']]['user_id'].unique().tolist()
        
        # Count events
        event_counts = match_df['event'].value_counts().to_dict()
        
        # Duration (max timestamp relative)
        duration_ms = int(match_df['ts_rel'].max())
        
        short_id = short_match_id(match_id)
        
        # Build match data - group by player for efficient rendering
        players_data = {}
        for user_id, player_df in match_df.groupby('user_id'):
            player_df_sorted = player_df.sort_values('ts_rel')
            
            events_list = []
            for _, row in player_df_sorted.iterrows():
                event_entry = {
                    "t": int(row['ts_rel']),
                    "x": row['px_x'],
                    "y": row['px_y'],
                    "e": row['event'],
                }
                events_list.append(event_entry)
            
            players_data[str(user_id)] = {
                "is_bot": bool(is_bot(user_id)),
                "events": events_list,
            }
        
        match_data = {
            "match_id": match_id,
            "map_id": map_id,
            "date": date,
            "duration_ms": duration_ms,
            "human_count": len(humans),
            "bot_count": len(bots),
            "players": players_data,
        }
        
        # Write match file
        match_file = os.path.join(matches_dir, f"{short_id}.json")
        with open(match_file, 'w') as f:
            json.dump(match_data, f, separators=(',', ':'))
        
        # Add to index
        matches_index.append({
            "id": short_id,
            "match_id": match_id,
            "map_id": map_id,
            "date": date,
            "humans": len(humans),
            "bots": len(bots),
            "events": event_counts,
            "duration_ms": duration_ms,
        })
    
    # Write index
    index_file = os.path.join(OUTPUT_DIR, "matches_index.json")
    with open(index_file, 'w') as f:
        json.dump(matches_index, f, separators=(',', ':'))
    
    print(f"  Generated {len(matches_index)} match files")
    print(f"  Index written to {index_file}")

def generate_heatmaps(df: pd.DataFrame):
    """Generate pre-computed heatmap grid data for each map."""
    heatmaps_dir = os.path.join(OUTPUT_DIR, "heatmaps")
    os.makedirs(heatmaps_dir, exist_ok=True)
    
    GRID_SIZE = 64  # 64x64 grid for heatmaps
    cell_size = MAP_SIZE / GRID_SIZE
    
    for map_id in MAP_CONFIG.keys():
        map_df = df[df['map_id'] == map_id].copy()
        
        if map_df.empty:
            continue
        
        # Initialize grids
        kill_grid = [[0] * GRID_SIZE for _ in range(GRID_SIZE)]
        death_grid = [[0] * GRID_SIZE for _ in range(GRID_SIZE)]
        traffic_grid = [[0] * GRID_SIZE for _ in range(GRID_SIZE)]
        loot_grid = [[0] * GRID_SIZE for _ in range(GRID_SIZE)]
        
        kill_events = {'Kill', 'BotKill'}
        death_events = {'Killed', 'BotKilled', 'KilledByStorm'}
        position_events = {'Position', 'BotPosition'}
        
        for _, row in map_df.iterrows():
            px, py = row['px_x'], row['px_y']
            if px is None or py is None:
                continue
            
            gx = min(max(int(px / cell_size), 0), GRID_SIZE - 1)
            gy = min(max(int(py / cell_size), 0), GRID_SIZE - 1)
            
            event = row['event']
            if event in kill_events:
                kill_grid[gy][gx] += 1
            elif event in death_events:
                death_grid[gy][gx] += 1
            elif event in position_events:
                traffic_grid[gy][gx] += 1
            elif event == 'Loot':
                loot_grid[gy][gx] += 1
        
        heatmap_data = {
            "map_id": map_id,
            "grid_size": GRID_SIZE,
            "kills": kill_grid,
            "deaths": death_grid,
            "traffic": traffic_grid,
            "loot": loot_grid,
        }
        
        heatmap_file = os.path.join(heatmaps_dir, f"{map_id}.json")
        with open(heatmap_file, 'w') as f:
            json.dump(heatmap_data, f, separators=(',', ':'))
        
        print(f"  Heatmap for {map_id}: kills={sum(sum(r) for r in kill_grid)}, deaths={sum(sum(r) for r in death_grid)}, traffic={sum(sum(r) for r in traffic_grid)}")

def main():
    print("=" * 60)
    print("LILA BLACK - Data Preprocessing")
    print("=" * 60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("\n1. Loading parquet files...")
    df = load_all_data()
    
    print("\n2. Processing data...")
    df = process_data(df)
    
    print("\n3. Generating match files...")
    generate_match_files(df)
    
    print("\n4. Generating heatmap data...")
    generate_heatmaps(df)
    
    print("\n" + "=" * 60)
    print("Preprocessing complete!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
