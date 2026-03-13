# INSIGHTS.md

**Three Insights from LILA BLACK Telemetry (Feb 10–14, 2026)**

---

## Insight 1: Kill Zones Are Heavily Concentrated in Urban/Structural Areas of Ambrose Valley

### What I Saw
On the AmbroseValley heatmap (Kill Zones mode), kill events cluster intensely around 2–3 specific areas — particularly the central building complex and the northern industrial zone — while large portions of the map near the river and southern fields see almost zero combat.

### Supporting Evidence
- **1,799 total kill events** logged on AmbroseValley across 5 days
- Kill heatmap shows >80% of those events concentrate in ~15% of the map area (visually estimable from the 64×64 grid intensity)
- The top-density grid cells show 10–15x more kills than the median cell

### Actionable Recommendation
**Death spiral risk**: These hotspot areas likely create a feedback loop where players drop into known loot-rich areas, creating predictable fight patterns that experienced players farm and inexperienced players die in repeatedly. 

| Metric | Impact |
|--------|--------|
| Match engagement rate | Could increase if loot is redistributed to draw players to currently-ignored zones |
| Player retention | New players dying in the same spot repeatedly is a churn signal |
| Map coverage | Southern/river areas appear underutilized — adding objectives there would improve map usage |

**Actionable item**: Add a high-value extract point or objective near the underutilized southern region to pull traffic away from the permanent hotspots.

---

## Insight 2: Storm Deaths Are Rare — Players Are Successfully Tracking the Storm

### What I Saw
`KilledByStorm` events are far less frequent than player-vs-player kills across all maps. On AmbroseValley I count only 505 storm deaths vs 1,799 kill events — a ratio of roughly **1 storm death per 3.6 PvP kills**.

### Supporting Evidence
- Heatmap in "Death Zones" mode shows storm deaths distributed at the *edges* of the map, not in concentric circles moving inward, suggesting players aren't being caught mid-map by the storm
- Storm deaths predominantly appear in the same outer-edge cells, indicating fixed entry points rather than a dynamic shrinking zone

### Actionable Recommendation
If the storm is meant to create urgency and force player decisions, it's currently not punishing enough. Players appear to be safely reading and avoiding the storm most of the time.

| Metric | Impact |
|--------|--------|
| Match tension | Currently low — storm is rarely a deciding factor |
| Match duration | Could be shortened/intensified with a faster storm phase |
| Map pressure | Storm is not effectively funneling players into confrontations |

**Actionable item**: Evaluate storm speed tuning. If the design goal is for the storm to create forced confrontations, an acceleration phase in mid-game would be effective.

---

## Insight 3: Grand Rift and Lockdown Are Dramatically Under-Played vs Ambrose Valley

### What I Saw
Across 5 days and 796 total matches, the distribution is extremely lopsided. The filter panel immediately reveals this: Ambrose Valley has 566 matches, while Grand Rift and Lockdown combined have only ~230.

### Supporting Evidence
- **AmbroseValley**: 566 matches, 1,799 kills, 48,754 position samples
- **GrandRift**: ~5,728 position samples — only **12% of AmbroseValley traffic**
- **Lockdown**: 18,577 traffic events — **38% of AmbroseValley traffic**
- GrandRift has only 193 kills total across all 5 days vs AmbroseValley's 1,799

### Actionable Recommendation
The 70/18/12 traffic split between maps suggests players actively prefer (or are disproportionately queued into) AmbroseValley. This is a map diversity problem.

| Metric | Impact |
|--------|--------|
| Player satisfaction | Players who dislike AmbroseValley have few alternatives |
| Map design ROI | GrandRift and Lockdown represent design investment with low utilization |
| Queue times | Heavily weighted queues can increase wait times for non-preferred maps |

**Actionable item**: Investigate if this is a matchmaking weighting issue or player preference. Run A/B tests on queue rotation. If it's preference-driven, invest in GrandRift design iteration — the low kill count (193) suggests it may not deliver satisfying combat encounters.

---

*These insights were derived using the LILA BLACK Player Journey Visualization Tool — select Kill Zones heatmap on AmbroseValley, then switch maps to compare traffic density visually.*
