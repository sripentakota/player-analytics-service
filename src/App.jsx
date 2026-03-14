import { useState, useEffect, useCallback } from 'react'
import './index.css'
import FilterPanel from './components/FilterPanel'
import MapViewer from './components/MapViewer'
import Timeline from './components/Timeline'

const EVENT_CONFIG = {
    Kill: { color: 'var(--color-kill)', label: 'Player Kill', shape: 'diamond' },
    Killed: { color: 'var(--color-killed)', label: 'Player Death', shape: 'x' },
    BotKill: { color: 'var(--color-botkill)', label: 'Bot Kill', shape: 'diamond' },
    BotKilled: { color: 'var(--color-botkilled)', label: 'Player Death (by Bot)', shape: 'x' },
    KilledByStorm: { color: 'var(--color-storm)', label: 'Storm Death', shape: 'triangle' },
    Loot: { color: 'var(--color-loot)', label: 'Loot Pickup', shape: 'circle' },
}

function LegendSymbol({ shape, color }) {
    if (shape === 'diamond') {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" className="legend-marker" style={{ background: 'transparent', boxShadow: 'none' }}>
                <path d="M7 2 L12 7 L7 12 L2 7 Z" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
            </svg>
        )
    }
    if (shape === 'x') {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" className="legend-marker" style={{ background: 'transparent', boxShadow: 'none' }}>
                <path d="M3 3 L11 11 M11 3 L3 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        )
    }
    if (shape === 'triangle') {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" className="legend-marker" style={{ background: 'transparent', boxShadow: 'none' }}>
                <path d="M7 2 L12 11 L2 11 Z" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
            </svg>
        )
    }
    if (shape === 'circle') {
        return (
            <svg width="14" height="14" viewBox="0 0 14 14" className="legend-marker" style={{ background: 'transparent', boxShadow: 'none' }}>
                <circle cx="7" cy="7" r="4" fill={color} />
            </svg>
        )
    }
    return <div className="legend-marker" style={{ background: color }} />
}

function App() {
  const [matchesIndex, setMatchesIndex] = useState([])
  const [selectedMap, setSelectedMap] = useState('AmbroseValley')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  
  // Player Journey state
  const [selectedUserId, setSelectedUserId] = useState('all')

  // Filter states
  const [showHumans, setShowHumans] = useState(true)
  const [showBots, setShowBots] = useState(true)
  const [showEvents, setShowEvents] = useState({
    Kill: true, Killed: true, BotKill: true, BotKilled: true,
    KilledByStorm: true, Loot: true,
  })

  // Heatmap state
  const [heatmapMode, setHeatmapMode] = useState('none')
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.6)
  const [heatmapData, setHeatmapData] = useState(null)

  // Timeline state
  const [timelinePosition, setTimelinePosition] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Load matches index
  useEffect(() => {
    fetch('/data/matches_index.json')
      .then(r => r.json())
      .then(data => {
        setMatchesIndex(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load matches index:', err)
        setLoading(false)
      })
  }, [])

  // Load heatmap data when map changes
  useEffect(() => {
    if (heatmapMode !== 'none') {
      fetch(`/data/heatmaps/${selectedMap}.json`)
        .then(r => r.json())
        .then(setHeatmapData)
        .catch(console.error)
    }
  }, [selectedMap, heatmapMode])

  // Filtered matches based on map and date
  const filteredMatches = matchesIndex.filter(m => {
    if (m.map_id !== selectedMap) return false
    if (selectedDate !== 'all' && m.date !== selectedDate) return false
    return true
  })

  // Get available dates for selected map
  const availableDates = [...new Set(matchesIndex.filter(m => m.map_id === selectedMap).map(m => m.date))].sort()

  // Load match data
  const loadMatch = useCallback((matchShortId) => {
    setMatchLoading(true)
    setTimelinePosition(1)
    setIsPlaying(false)
    fetch(`/data/matches/${matchShortId}.json`)
      .then(r => r.json())
      .then(data => {
        setMatchData(data)
        setSelectedMatchId(matchShortId)
        setMatchLoading(false)
      })
      .catch(err => {
        console.error('Failed to load match:', err)
        setMatchLoading(false)
      })
  }, [])

  // Stats & Users
  const mapMatches = matchesIndex.filter(m => m.map_id === selectedMap)
  const totalHumans = mapMatches.reduce((sum, m) => sum + m.humans, 0)
  const totalBots = mapMatches.reduce((sum, m) => sum + m.bots, 0)
  
  const matchUsers = matchData 
    ? Object.entries(matchData.players).map(([id, p]) => ({ id, isBot: p.is_bot })).sort((a, b) => a.isBot === b.isBot ? 0 : a.isBot ? 1 : -1) 
    : []

  return (
    <div className="app-container">
      <FilterPanel
        selectedMap={selectedMap}
        onMapChange={(map) => { setSelectedMap(map); setSelectedMatchId(null); setMatchData(null); setSelectedDate('all'); setSelectedUserId('all') }}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
        filteredMatches={filteredMatches}
        selectedMatchId={selectedMatchId}
        onMatchSelect={loadMatch}
        showHumans={showHumans}
        onToggleHumans={() => setShowHumans(v => !v)}
        showBots={showBots}
        onToggleBots={() => setShowBots(v => !v)}
        showEvents={showEvents}
        onToggleEvent={(evt) => setShowEvents(prev => ({ ...prev, [evt]: !prev[evt] }))}
        heatmapMode={heatmapMode}
        onHeatmapModeChange={setHeatmapMode}
        heatmapOpacity={heatmapOpacity}
        onHeatmapOpacityChange={setHeatmapOpacity}
        mapStats={{ matches: mapMatches.length, humans: totalHumans, bots: totalBots }}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        matchUsers={matchUsers}
      />

      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-info">
            <div className="top-bar-stat">
              Map: <span className="value">{selectedMap}</span>
            </div>
            {matchData && (
              <>
                <div className="match-info-badge">
                  👤 <span className="count">{matchData.human_count ?? matchUsers.filter(u => !u.isBot).length}</span> humans
                </div>
                <div className="match-info-badge">
                  🤖 <span className="count">{matchData.bot_count ?? matchUsers.filter(u => u.isBot).length}</span> bots
                </div>
              </>
            )}
          </div>
          <div className="top-bar-controls">
            {matchData && (
              <div className="top-bar-stat">
                Duration: <span className="value">{formatDuration(matchData.duration_ms)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="map-area">
          {loading ? (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <div className="loading-text">Loading telemetry data...</div>
            </div>
          ) : matchLoading ? (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <div className="loading-text">Loading match data...</div>
            </div>
          ) : !matchData ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <div className="empty-state-text">Select a match to begin</div>
              <div className="empty-state-hint">Choose a map, date, and match from the sidebar</div>
            </div>
          ) : (
            <MapViewer
              mapId={selectedMap}
              matchData={matchData}
              showHumans={showHumans}
              showBots={showBots}
              showEvents={showEvents}
              timelinePosition={timelinePosition}
              heatmapMode={heatmapMode}
              heatmapOpacity={heatmapOpacity}
              heatmapData={heatmapData}
              selectedUserId={selectedUserId}
            />
          )}

          {/* Map Overlay Legend */}
          {matchData && (
            <div className="map-legend-overlay">
              <div className="filter-section-title">Legend</div>
              <div className="legend-items">
                  <div className="legend-item">
                      <div className="legend-marker" style={{ background: 'var(--color-human-path)', height: '4px', borderRadius: '2px', width: '20px' }} />
                      Human Journey 👤
                  </div>
                  <div className="legend-item">
                      <div className="legend-marker" style={{ background: 'var(--color-bot-path)', height: '4px', borderRadius: '2px', width: '20px' }} />
                      Bot Journey 🤖
                  </div>
                  {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                      <div key={key} className="legend-item">
                          <LegendSymbol shape={cfg.shape} color={cfg.color} />
                          {cfg.label}
                      </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {matchData && (
          <Timeline
            duration={matchData.duration_ms}
            position={timelinePosition}
            onPositionChange={setTimelinePosition}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(v => !v)}
            speed={playbackSpeed}
            onSpeedChange={setPlaybackSpeed}
          />
        )}
      </div>
    </div>
  )
}

function formatDuration(sec) {
  const totalSec = Math.floor(sec)
  const min = Math.floor(totalSec / 60)
  const remainderSec = totalSec % 60
  return `${min}:${String(remainderSec).padStart(2, '0')}`
}

export default App
