import { useCallback, useRef } from 'react'

import type { RegionConfig } from '../lib/preprocessing.types'
import { useNotesStore } from '../store'

/**
 * Visual overlay on the screenshot preview showing the crop region.
 * The user can drag the top edge to adjust the region vertically.
 */
export function RegionOverlay() {
  const regionConfig = useNotesStore((s) => s.regionConfig)
  const setRegionConfig = useNotesStore((s) => s.setRegionConfig)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const yFraction = Math.max(0.1, Math.min(0.9, (e.clientY - rect.top) / rect.height))

      const newRegion: RegionConfig = {
        ...regionConfig,
        y: yFraction,
        height: 1 - yFraction,
      }
      setRegionConfig(newRegion)
    },
    [regionConfig, setRegionConfig]
  )

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const topPercent = regionConfig.y * 100
  const leftPercent = regionConfig.x * 100
  const widthPercent = regionConfig.width * 100
  const heightPercent = regionConfig.height * 100

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Darkened excluded region (top) */}
      <div
        className="absolute left-0 top-0 w-full bg-black/60"
        style={{ height: `${topPercent}%` }}
      />

      {/* Crop region border */}
      <div
        className="absolute border-2 border-sky-500/70"
        style={{
          top: `${topPercent}%`,
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
        }}
      />

      {/* Draggable top edge handle */}
      <div
        className="pointer-events-auto absolute left-1/2 -translate-x-1/2 cursor-ns-resize"
        style={{ top: `calc(${topPercent}% - 6px)` }}
        onPointerDown={handlePointerDown}
      >
        <div className="h-3 w-12 rounded-full bg-sky-500/80 hover:bg-sky-400 transition-colors" />
      </div>

      {/* Label */}
      <div
        className="absolute left-2 text-xs text-sky-400/80"
        style={{ top: `calc(${topPercent}% + 4px)` }}
      >
        OCR region
      </div>
    </div>
  )
}
