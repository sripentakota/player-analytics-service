import { useMemo } from 'react'

const EVENT_CONFIG = {
    Kill: { color: 'var(--color-kill)', label: 'Player Kill' },
    Killed: { color: 'var(--color-killed)', label: 'Player Death' },
    BotKill: { color: 'var(--color-botkill)', label: 'Bot Kill' },
    BotKilled: { color: 'var(--color-botkilled)', label: 'Bot Death' },
    KilledByStorm: { color: 'var(--color-storm)', label: 'Storm Death' },
    Loot: { color: 'var(--color-loot)', label: 'Loot Pickup' },
}

const MAPS = ['AmbroseValley', 'GrandRift', 'Lockdown']
const MAP_LABELS = { AmbroseValley: 'Ambrose Valley', GrandRift: 'Grand Rift', Lockdown: 'Lockdown' }

const HEATMAP_MODES = [
    { value: 'none', label: 'Off' },
    { value: 'kills', label: '🔥 Kill Zones' },
    { value: 'deaths', label: '💀 Death Zones' },
    { value: 'traffic', label: '👣 Traffic' },
    { value: 'loot', label: '📦 Loot Zones' },
]

export default function FilterPanel({
    selectedMap, onMapChange,
    selectedDate, onDateChange, availableDates,
    filteredMatches, selectedMatchId, onMatchSelect,
    showHumans, onToggleHumans,
    showBots, onToggleBots,
    showEvents, onToggleEvent,
    heatmapMode, onHeatmapModeChange,
    heatmapOpacity, onHeatmapOpacityChange,
    mapStats,
}) {
    const dateLabels = {
        'February_10': 'Feb 10',
        'February_11': 'Feb 11',
        'February_12': 'Feb 12',
        'February_13': 'Feb 13',
        'February_14': 'Feb 14',
    }

    const sortedMatches = useMemo(() => {
        return [...filteredMatches].sort((a, b) => b.humans - a.humans)
    }, [filteredMatches])

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <h1>LILA BLACK</h1>
                    <span className="badge">ANALYTICS</span>
                </div>
                <p className="sidebar-subtitle">Player Journey Visualization</p>
            </div>

            {/* Map Stats */}
            <div className="filter-section">
                <div className="stat-cards">
                    <div className="stat-card">
                        <div className="stat-card-value">{mapStats.matches}</div>
                        <div className="stat-card-label">Matches</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value">{mapStats.humans}</div>
                        <div className="stat-card-label">Human Sessions</div>
                    </div>
                </div>
            </div>

            {/* Map Selection */}
            <div className="filter-section">
                <div className="filter-section-title">Map</div>
                <select
                    className="filter-select"
                    value={selectedMap}
                    onChange={e => onMapChange(e.target.value)}
                >
                    {MAPS.map(map => (
                        <option key={map} value={map}>{MAP_LABELS[map]}</option>
                    ))}
                </select>
            </div>

            {/* Date Filter */}
            <div className="filter-section">
                <div className="filter-section-title">Date</div>
                <select
                    className="filter-select"
                    value={selectedDate}
                    onChange={e => onDateChange(e.target.value)}
                >
                    <option value="all">All Dates</option>
                    {availableDates.map(date => (
                        <option key={date} value={date}>{dateLabels[date] || date}</option>
                    ))}
                </select>
            </div>

            {/* Match Selection */}
            <div className="filter-section">
                <div className="filter-section-title">Match ({sortedMatches.length} available)</div>
                <select
                    className="filter-select"
                    value={selectedMatchId || ''}
                    onChange={e => e.target.value && onMatchSelect(e.target.value)}
                >
                    <option value="">Select a match...</option>
                    {sortedMatches.map(match => (
                        <option key={match.id} value={match.id}>
                            {match.id.substring(0, 8)} · {match.humans}H/{match.bots}B
                        </option>
                    ))}
                </select>
            </div>

            {/* Player Type */}
            <div className="filter-section">
                <div className="filter-section-title">Player Type</div>
                <div className="toggle-group">
                    <button
                        className={`toggle-chip ${showHumans ? 'active' : ''}`}
                        onClick={onToggleHumans}
                    >
                        <span className="dot" style={{ background: 'var(--color-human-path)' }} />
                        Humans
                    </button>
                    <button
                        className={`toggle-chip ${showBots ? 'active' : ''}`}
                        onClick={onToggleBots}
                    >
                        <span className="dot" style={{ background: 'var(--color-bot-path)' }} />
                        Bots
                    </button>
                </div>
            </div>

            {/* Event Types */}
            <div className="filter-section">
                <div className="filter-section-title">Event Markers</div>
                <div className="toggle-group">
                    {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            className={`toggle-chip ${showEvents[key] ? 'active' : ''}`}
                            onClick={() => onToggleEvent(key)}
                        >
                            <span className="dot" style={{ background: cfg.color }} />
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Heatmap */}
            <div className="filter-section">
                <div className="filter-section-title">Heatmap Overlay</div>
                <div className="heatmap-controls">
                    <select
                        className="filter-select"
                        value={heatmapMode}
                        onChange={e => onHeatmapModeChange(e.target.value)}
                    >
                        {HEATMAP_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                    </select>
                    {heatmapMode !== 'none' && (
                        <div className="heatmap-slider-row">
                            <label>Opacity</label>
                            <input
                                type="range"
                                className="opacity-slider"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={heatmapOpacity}
                                onChange={e => onHeatmapOpacityChange(parseFloat(e.target.value))}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="filter-section">
                <div className="filter-section-title">Legend</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-marker" style={{ background: 'var(--color-human-path)', height: '3px', borderRadius: '2px' }} />
                        Human Path
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker" style={{ background: 'var(--color-bot-path)', height: '3px', borderRadius: '2px' }} />
                        Bot Path
                    </div>
                    {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                        <div key={key} className="legend-item">
                            <div className="legend-marker" style={{ background: cfg.color }} />
                            {cfg.label}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    )
}
