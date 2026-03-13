import { useRef, useEffect, useState, useCallback } from 'react'

const MINIMAP_FILES = {
    AmbroseValley: '/minimaps/AmbroseValley_Minimap.png',
    GrandRift: '/minimaps/GrandRift_Minimap.png',
    Lockdown: '/minimaps/Lockdown_Minimap.jpg',
}

const EVENT_COLORS = {
    Kill: '#ff4757',
    Killed: '#ff6b81',
    BotKill: '#ff9f43',
    BotKilled: '#ffc078',
    KilledByStorm: '#a855f7',
    Loot: '#ffd43b',
}

const HUMAN_PATH_COLOR = '#5ce1e6'
const BOT_PATH_COLOR = '#ff9f43'
const CANVAS_SIZE = 700
const MAP_SIZE = 1024

export default function MapViewer({
    mapId, matchData, showHumans, showBots, showEvents,
    timelinePosition, heatmapMode, heatmapOpacity, heatmapData,
}) {
    const canvasRef = useRef(null)
    const minimapRef = useRef(null)
    const [minimapLoaded, setMinimapLoaded] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const isPanning = useRef(false)
    const lastMouse = useRef({ x: 0, y: 0 })

    // Load minimap image
    useEffect(() => {
        const img = new Image()
        img.onload = () => {
            minimapRef.current = img
            setMinimapLoaded(true)
        }
        img.src = MINIMAP_FILES[mapId]
        setMinimapLoaded(false)
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }, [mapId])

    // Draw everything
    useEffect(() => {
        if (!minimapLoaded || !canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const scale = CANVAS_SIZE / MAP_SIZE

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
        ctx.save()

        // Apply zoom & pan
        ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2)
        ctx.scale(zoom, zoom)
        ctx.translate(-CANVAS_SIZE / 2 + pan.x, -CANVAS_SIZE / 2 + pan.y)

        // Draw minimap
        ctx.drawImage(minimapRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

        // Draw heatmap overlay
        if (heatmapMode !== 'none' && heatmapData && heatmapData.map_id === mapId) {
            drawHeatmap(ctx, heatmapData, heatmapMode, heatmapOpacity, scale)
        }

        // Draw match data
        if (matchData) {
            const maxTime = matchData.duration_ms * timelinePosition

            Object.entries(matchData.players).forEach(([userId, playerData]) => {
                const isBot = playerData.is_bot
                if (isBot && !showBots) return
                if (!isBot && !showHumans) return

                const events = playerData.events.filter(e => e.t <= maxTime)
                if (events.length === 0) return

                // Draw path
                const posEvents = events.filter(e =>
                    e.e === 'Position' || e.e === 'BotPosition'
                )

                if (posEvents.length > 1) {
                    ctx.beginPath()
                    ctx.strokeStyle = isBot ? BOT_PATH_COLOR : HUMAN_PATH_COLOR
                    ctx.globalAlpha = isBot ? 0.25 : 0.5
                    ctx.lineWidth = isBot ? 1 : 1.5
                    ctx.lineJoin = 'round'
                    ctx.lineCap = 'round'

                    ctx.moveTo(posEvents[0].x * scale, posEvents[0].y * scale)
                    for (let i = 1; i < posEvents.length; i++) {
                        ctx.lineTo(posEvents[i].x * scale, posEvents[i].y * scale)
                    }
                    ctx.stroke()
                    ctx.globalAlpha = 1
                }

                // Draw event markers
                events.forEach(ev => {
                    if (ev.e === 'Position' || ev.e === 'BotPosition') return
                    if (!showEvents[ev.e]) return

                    const color = EVENT_COLORS[ev.e]
                    if (!color) return

                    const px = ev.x * scale
                    const py = ev.y * scale
                    const r = ev.e === 'Loot' ? 4 : 5

                    ctx.beginPath()
                    ctx.fillStyle = color
                    ctx.globalAlpha = 0.9

                    if (ev.e === 'Kill' || ev.e === 'BotKill') {
                        // Crosshair / diamond
                        drawDiamond(ctx, px, py, r)
                    } else if (ev.e === 'Killed' || ev.e === 'BotKilled') {
                        // X marker
                        drawX(ctx, px, py, r)
                    } else if (ev.e === 'KilledByStorm') {
                        // Triangle
                        drawTriangle(ctx, px, py, r)
                    } else if (ev.e === 'Loot') {
                        // Small circle
                        ctx.arc(px, py, r - 1, 0, Math.PI * 2)
                        ctx.fill()
                    }

                    ctx.globalAlpha = 1
                })
            })
        }

        ctx.restore()
    }, [minimapLoaded, matchData, showHumans, showBots, showEvents, timelinePosition, zoom, pan, heatmapMode, heatmapOpacity, heatmapData, mapId])

    // Mouse wheel zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.min(Math.max(z * delta, 0.5), 5))
    }, [])

    // Pan handlers
    const handleMouseDown = useCallback((e) => {
        isPanning.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
    }, [])

    const handleMouseMove = useCallback((e) => {
        if (!isPanning.current) return
        const dx = (e.clientX - lastMouse.current.x) / zoom
        const dy = (e.clientY - lastMouse.current.y) / zoom
        setPan(p => ({ x: p.x + dx, y: p.y + dy }))
        lastMouse.current = { x: e.clientX, y: e.clientY }
    }, [zoom])

    const handleMouseUp = useCallback(() => {
        isPanning.current = false
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        return () => canvas.removeEventListener('wheel', handleWheel)
    }, [handleWheel])

    if (!minimapLoaded) {
        return (
            <div className="loading-overlay" style={{ position: 'relative' }}>
                <div className="loading-spinner" />
                <div className="loading-text">Loading minimap...</div>
            </div>
        )
    }

    return (
        <div className="map-canvas-container">
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    )
}

function drawDiamond(ctx, x, y, r) {
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r, y)
    ctx.lineTo(x, y + r)
    ctx.lineTo(x - r, y)
    ctx.closePath()
    ctx.fill()
    // Add outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
}

function drawX(ctx, x, y, r) {
    ctx.lineWidth = 2.5
    ctx.strokeStyle = ctx.fillStyle
    ctx.beginPath()
    ctx.moveTo(x - r, y - r)
    ctx.lineTo(x + r, y + r)
    ctx.moveTo(x + r, y - r)
    ctx.lineTo(x - r, y + r)
    ctx.stroke()
}

function drawTriangle(ctx, x, y, r) {
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r, y + r * 0.7)
    ctx.lineTo(x - r, y + r * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
}

function drawHeatmap(ctx, heatmapData, mode, opacity, mapScale) {
    const grid = heatmapData[mode]
    if (!grid) return

    const gridSize = heatmapData.grid_size
    const cellW = (CANVAS_SIZE) / gridSize
    const cellH = (CANVAS_SIZE) / gridSize

    // Find max value for normalization
    let maxVal = 0
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] > maxVal) maxVal = grid[y][x]
        }
    }
    if (maxVal === 0) return

    ctx.globalAlpha = opacity

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const val = grid[y][x]
            if (val === 0) continue

            const intensity = Math.pow(val / maxVal, 0.5) // sqrt for better distribution
            const hue = mode === 'kills' ? 0 : mode === 'deaths' ? 270 : mode === 'loot' ? 45 : 180
            const saturation = 80 + intensity * 20
            const lightness = 20 + intensity * 40

            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5)
        }
    }

    ctx.globalAlpha = 1
}
