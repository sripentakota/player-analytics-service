import { useEffect, useRef } from 'react'

export default function Timeline({
    duration, position, onPositionChange,
    isPlaying, onPlayToggle,
    speed, onSpeedChange,
}) {
    const animFrameRef = useRef(null)
    const lastTimeRef = useRef(null)

    // Playback animation
    useEffect(() => {
        if (!isPlaying) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
            lastTimeRef.current = null
            return
        }

        const animate = (timestamp) => {
            if (lastTimeRef.current === null) {
                lastTimeRef.current = timestamp
            }

            const delta = timestamp - lastTimeRef.current
            lastTimeRef.current = timestamp

            // Advance position: one full playback in ~30 seconds at 1x speed
            const increment = (delta / (30000 / speed))

            onPositionChange(prev => {
                const next = (typeof prev === 'number' ? prev : 0) + increment
                if (next >= 1) {
                    onPlayToggle() // Auto-pause at end
                    return 1
                }
                return next
            })

            animFrameRef.current = requestAnimationFrame(animate)
        }

        animFrameRef.current = requestAnimationFrame(animate)
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [isPlaying, speed, onPositionChange, onPlayToggle])

    const currentTimeSec = Math.round(duration * position)
    const currentTime = formatTime(currentTimeSec)
    const totalTime = formatTime(duration)

    return (
        <div className="timeline-container">
            <div className="timeline-controls">
                {/* Reset */}
                <button
                    className="timeline-btn"
                    onClick={() => { onPositionChange(0) }}
                    title="Reset"
                >
                    ⏮
                </button>

                {/* Play/Pause */}
                <button
                    className={`timeline-btn ${isPlaying ? 'active' : ''}`}
                    onClick={onPlayToggle}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Speed */}
                <select
                    className="speed-select"
                    value={speed}
                    onChange={e => onSpeedChange(Number(e.target.value))}
                >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                </select>
            </div>

            {/* Slider */}
            <div className="timeline-slider-wrap">
                <input
                    type="range"
                    className="timeline-slider"
                    min="0"
                    max="1"
                    step="0.001"
                    value={position}
                    onChange={e => onPositionChange(parseFloat(e.target.value))}
                />
            </div>

            {/* Time Display */}
            <div className="timeline-time">
                {currentTime} / {totalTime}
            </div>
        </div>
    )
}

function formatTime(sec) {
    const totalSec = Math.floor(sec)
    const min = Math.floor(totalSec / 60)
    const remainderSec = totalSec % 60
    return `${min}:${String(remainderSec).padStart(2, '0')}`
}
