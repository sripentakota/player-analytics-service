# Gameplay Insights — LILA BLACK Telemetry Analysis

## Executive Summary
Analysis of player telemetry across ~89k events from 796 matches reveals three key gameplay patterns:
1. **Environmental pressure dominates eliminations** — players die significantly more often to the storm than to PvP combat.
2. **Combat encounters cluster in specific regions** of the map, particularly in AmbroseValley, suggesting terrain or loot placement funnels players into certain zones.
3. **Player eliminations occur very early** in the match timeline, indicating extremely fast match pacing.

Together these patterns suggest that early player clustering combined with strong environmental pressure may be shortening match lifecycles and limiting mid-game engagement. The insights below outline evidence and potential design implications for improving match pacing and encounter variety.

## Dataset Context
The analysis uses 5 days of production gameplay telemetry containing:
- ~89,000 recorded player events
- 1,243 player journey files
- 796 matches
- 339 unique players
- 3 playable maps:
  - AmbroseValley
  - GrandRift
  - Lockdown

Each file represents a single player’s journey within one match, including movement events, combat interactions, loot pickups, and environmental deaths.

## Insight 1 — Storm deaths dominate eliminations compared to PvP kills

### What caught your eye in the data
While analyzing combat-related events, it became clear that very few eliminations occur through player-versus-player combat, while a significantly larger number of players die to the storm.

### Evidence
Event frequency analysis shows:
- **PvP kills**: 3
- **Storm deaths**: 39
- **PvP / Storm ratio**: 0.08
This means players are over 13× more likely to die from the storm than from another player.

**Map-level breakdown:**
| Map | PvP Kills | Storm Deaths |
| :--- | :--- | :--- |
| AmbroseValley | 2 | 17 |
| GrandRift | 1 | 5 |
| Lockdown | 0 | 17 |

Notably, Lockdown recorded zero PvP kills while 17 players died to the storm, suggesting environmental pressure plays an even larger role on smaller maps.

### Actionable implication
The storm currently appears to be too punishing relative to PvP combat.
**Possible design adjustments:**
- Slow storm progression slightly
- Reduce storm damage scaling
- Increase opportunities for player encounters before storm pressure becomes lethal

**Metrics to monitor after adjustments:**
- PvP kill rate
- Storm death percentage
- Average player survival time
- Mid-game combat frequency

### Why a level designer should care
Environmental mechanics like the storm are intended to guide player movement and force engagements, but if they become the primary cause of death, they may reduce opportunities for player interaction and combat-driven gameplay. Balancing storm pressure ensures that players engage with each other more frequently, improving match excitement and competitive dynamics.

## Insight 2 — Combat encounters cluster heavily in specific map regions

### What caught your eye in the data
Spatial analysis of combat events reveals that player eliminations are not evenly distributed across the map. Instead, combat consistently clusters around a few highly concentrated areas, particularly near the central region of AmbroseValley.

### Evidence
Analysis of combat events (Kill and BotKill) across the dataset shows the following distribution:
| Map | Total Combat Events |
| :--- | :--- |
| AmbroseValley | 1799 |
| Lockdown | 426 |
| GrandRift | 193 |

AmbroseValley accounts for the majority of combat interactions in the dataset. Spatial binning of kill coordinates identified several high-density zones. The top hotspot bins contained up to 40 combat events within a single spatial cell, indicating strong clustering of player encounters.

The spatial analysis further confirms:
- The central region of AmbroseValley shows the highest combat density
- Secondary clusters appear in the southern and eastern regions
- Large areas of the map experience very little combat activity

### Actionable implication
Combat clustering suggests that terrain layout, loot placement, or player traversal routes may be funneling players toward specific regions.
**Potential design adjustments include:**
- Redistributing high-value loot to underused map areas
- Adding alternative traversal paths to reduce funneling
- Adjusting terrain cover or landmarks to encourage engagement in quieter regions

**Metrics to monitor after adjustments:**
- Combat density distribution across map regions
- Player movement patterns
- Kill distribution variance across spatial bins

### Why a level designer should care
Uneven combat distribution can lead to predictable gameplay patterns, where the same locations consistently host most encounters while other areas remain underutilized. Balancing engagement density across the map improves exploration incentives, encounter variety, and overall match pacing, resulting in a more dynamic player experience.

## Insight 3 — Player eliminations occur almost immediately after match start

### What caught your eye in the data
The survival analysis shows an extremely strong concentration of player deaths at the very beginning of matches. The survival curve peaks sharply near the start of the match timeline, indicating that most players are eliminated almost immediately after spawning.

### Evidence
Analysis of death events across all matches shows:
- **Total deaths analyzed**: 742
- **Early deaths (<120 seconds)**: 742
- **Mid-game deaths (120–300 seconds)**: 0
- **Late-game deaths (>300 seconds)**: 0
This means 100% of eliminations occur during the early phase of the match.

Average match duration based on event timestamps is approximately 0.41 seconds, suggesting that most player journeys end very quickly in the telemetry data.

**Map-level comparison:**
| Map | Avg Death Time |
| :--- | :--- |
| GrandRift | ~0.023 seconds |
| AmbroseValley | ~0.051 seconds |
| Lockdown | ~0.094 seconds |

### Actionable implication
Extremely early eliminations may indicate that players encounter lethal threats too quickly after spawning.
**Potential adjustments could include:**
- Increasing initial safe-zone distance or spawn spacing
- Adjusting early-game bot density
- Delaying storm pressure or lethal hazards in the early phase

**Metrics to monitor after adjustments:**
- Early-game death percentage
- Average survival time per player
- Player engagement duration before first combat

### Why a level designer should care
If players are eliminated almost immediately after spawning, they may not experience core gameplay systems such as exploration, looting, or mid-game encounters. Improving early-game survivability helps ensure players have enough time to engage with the map, collect resources, and participate in meaningful combat encounters, ultimately improving match pacing and player experience.

## Bonus Insight — Early player clustering combined with strong environmental pressure may be shortening matches

### What caught your eye in the data
When combining combat distribution, death timing, and elimination causes, a clear pattern emerges: players appear to cluster early in specific regions of the map, and a large portion of eliminations are caused by the storm rather than PvP combat.

### Evidence
Three separate analyses support this pattern:
1. **Storm vs PvP eliminations**: Players are over 13× more likely to die to the storm than another player.
2. **Spatial combat clustering**: AmbroseValley recorded 1,799 combat events, with heavy clustering around central areas.
3. **Early death concentration**: 100% of deaths occur in the early phase of the match.

Together these signals suggest that players may cluster early in high-traffic regions and then be quickly eliminated by environmental pressure or early encounters.

### Actionable implication
This interaction between player clustering and environmental pressure could be influencing overall match pacing.
**Potential design considerations:**
- Redistribute loot to encourage wider player spread at match start
- Adjust early storm pressure to allow longer exploration and looting phases
- Introduce alternative traversal routes to reduce early combat funneling

### Why a level designer should care
Map layout, environmental pressure, and player movement patterns are tightly connected systems. If players cluster too early and environmental hazards eliminate them quickly, matches may end before players experience the full gameplay loop.

## Conclusion
The telemetry analysis highlights several interconnected gameplay dynamics affecting match pacing. The combination of high early-game elimination rates, strong storm lethality, and concentrated combat hotspots suggests opportunities to improve player distribution and engagement. Potential design adjustments around loot distribution, environmental pressure tuning, and traversal pathways could help balance encounter frequency and extend mid-game gameplay.
