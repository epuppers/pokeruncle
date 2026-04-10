import { Target, Hash } from 'lucide-react'

import { useTrainerStore } from '@/stores/trainerStore'

export function SessionHud() {
  const { handsPlayed, correctCount } = useTrainerStore((s) => s.sessionStats)
  const trainerMode = useTrainerStore((s) => s.trainerMode)

  if (handsPlayed === 0 && trainerMode.mode !== 'drill') return null

  const accuracy = handsPlayed > 0 ? Math.round((correctCount / handsPlayed) * 100) : 0

  return (
    <div className="flex items-center justify-center gap-6 rounded-lg bg-secondary/50 px-5 py-3 text-sm">
      <Stat label="Hands" value={handsPlayed} icon={Hash} />
      <Stat label="Accuracy" value={`${accuracy}%`} icon={Target} />
      {trainerMode.mode === 'drill' && (
        <Stat label="Remaining" value={trainerMode.remaining} />
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon?: typeof Target }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        {Icon && <Icon className="size-3 text-brass-dim" />}
        <span className="tabular-nums font-medium text-base text-foreground">{value}</span>
      </div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
