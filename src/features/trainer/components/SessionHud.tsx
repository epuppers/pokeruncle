import { useTrainerStore } from '@/stores/trainerStore'

export function SessionHud() {
  const { handsPlayed, correctCount, totalDecisionTimeMs } = useTrainerStore(
    (s) => s.sessionStats,
  )
  const trainerMode = useTrainerStore((s) => s.trainerMode)

  if (handsPlayed === 0 && trainerMode.mode !== 'drill') return null

  const accuracy = handsPlayed > 0 ? Math.round((correctCount / handsPlayed) * 100) : 0
  const avgTimeS = handsPlayed > 0 ? (totalDecisionTimeMs / handsPlayed / 1000).toFixed(1) : '—'
  const elapsedMinutes = totalDecisionTimeMs / 60_000
  const handsPerMinute =
    elapsedMinutes > 0 ? (handsPlayed / elapsedMinutes).toFixed(1) : '—'

  return (
    <div className="flex items-center justify-center gap-4 rounded-lg bg-neutral-900/50 px-4 py-2 text-xs">
      <Stat label="Hands" value={handsPlayed} />
      <Stat label="Accuracy" value={`${accuracy}%`} />
      <Stat label="Avg time" value={avgTimeS} />
      <Stat label="Hands/min" value={handsPerMinute} />
      {trainerMode.mode === 'drill' && (
        <Stat label="Remaining" value={trainerMode.remaining} />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums font-medium text-white">{value}</span>
      <span className="text-neutral-500">{label}</span>
    </div>
  )
}
