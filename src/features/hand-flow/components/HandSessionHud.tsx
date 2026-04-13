import { useEffect, useState } from 'react'
import { Target, Hash, Crosshair, Timer } from 'lucide-react'

import { useHandStore } from '@/stores/handStore'

/** Ticks every 10s to keep hands/minute fresh without being impure in render */
function useElapsedMinutes(sessionStartedAt: number, handsPlayed: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (handsPlayed === 0) return
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [handsPlayed])

  return (now - sessionStartedAt) / 60_000
}

/**
 * Session stats HUD for the unified hand flow.
 * Shows hands played, preflop accuracy, postflop accuracy, and hands/minute.
 */
export function HandSessionHud() {
  const stats = useHandStore((s) => s.sessionStats)
  const elapsedMin = useElapsedMinutes(stats.sessionStartedAt, stats.handsPlayed)

  if (stats.handsPlayed === 0) return null

  const preflopAcc = Math.round((stats.preflopCorrect / stats.handsPlayed) * 100)
  const postflopAcc =
    stats.postflopHands > 0
      ? Math.round((stats.postflopCorrect / stats.postflopHands) * 100)
      : null

  const handsPerMin = elapsedMin > 0.1 ? Math.round((stats.handsPlayed / elapsedMin) * 10) / 10 : 0

  return (
    <div className="flex items-center justify-center gap-6 rounded-lg bg-secondary/50 px-5 py-3 text-sm">
      <Stat label="Hands" value={stats.handsPlayed} icon={Hash} />
      <Stat label="Preflop" value={`${preflopAcc}%`} icon={Target} />
      {postflopAcc !== null && (
        <Stat label="Postflop" value={`${postflopAcc}%`} icon={Crosshair} />
      )}
      {handsPerMin > 0 && (
        <Stat label="Hands/min" value={handsPerMin} icon={Timer} />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Target
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Icon className="size-3 text-brass" />
        <span className="tabular-nums font-medium text-base text-foreground">{value}</span>
      </div>
      <span className="text-foreground/70">{label}</span>
    </div>
  )
}
