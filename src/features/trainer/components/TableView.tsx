import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { Position } from '@/types/poker'
import { cn } from '@/lib/utils'

import type { Spot } from '@/features/trainer/types'

interface TableViewProps {
  spot: Spot
}

const POSITION_ANGLES: Record<Position, { x: number; y: number }> = {
  UTG: { x: 20, y: 18 },
  MP: { x: 80, y: 18 },
  CO: { x: 95, y: 50 },
  BTN: { x: 80, y: 82 },
  SB: { x: 20, y: 82 },
  BB: { x: 5, y: 50 },
}

function getScenarioLabel(spot: Spot): string {
  const config = SCENARIOS.find((s) => s.id === spot.scenario)
  if (!config) return spot.scenario

  if (spot.kind === 'response') {
    return `${config.label} (${spot.villain})`
  }
  return config.label
}

function getActionHistory(spot: Spot): string[] {
  const actions: string[] = ['SB posts 0.5bb', 'BB posts 1bb']

  switch (spot.scenario) {
    case 'RFI':
      actions.push(`Folds to ${spot.hero}`)
      break
    case 'vs-open':
      if (spot.kind === 'response') {
        actions.push(`${spot.villain} opens`)
        actions.push(`Action on ${spot.hero}`)
      }
      break
    case 'vs-3bet':
      if (spot.kind === 'response') {
        actions.push(`${spot.hero} opens`)
        actions.push(`${spot.villain} 3-bets`)
        actions.push(`Action on ${spot.hero}`)
      }
      break
    case 'vs-4bet':
      if (spot.kind === 'response') {
        actions.push(`${spot.villain} opens`)
        actions.push(`${spot.hero} 3-bets`)
        actions.push(`${spot.villain} 4-bets`)
        actions.push(`Action on ${spot.hero}`)
      }
      break
    case '3bet-defense':
      if (spot.kind === 'response') {
        actions.push(`${spot.villain} opens`)
        actions.push(`${spot.hero} 3-bets`)
        actions.push(`${spot.villain} calls`)
        actions.push(`Action on ${spot.hero}`)
      }
      break
  }

  return actions
}

export function TableView({ spot }: TableViewProps) {
  const villain = spot.kind === 'response' ? spot.villain : undefined

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scenario label */}
      <div className="text-sm font-medium text-neutral-400">
        {getScenarioLabel(spot)}
      </div>

      {/* Table */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-[40%] border-2 border-amber-900/40 bg-gradient-to-br from-emerald-950/60 to-emerald-900/40">
        {/* Position labels */}
        {POSITIONS.map((pos) => {
          const { x, y } = POSITION_ANGLES[pos]
          const isHero = pos === spot.hero
          const isVillain = pos === villain

          return (
            <div
              key={pos}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium',
                  isHero && 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40',
                  isVillain && 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40',
                  !isHero && !isVillain && 'text-neutral-500',
                )}
              >
                <span>{pos}</span>
                <span className="text-[10px] tabular-nums text-neutral-600">100bb</span>
              </div>
            </div>
          )
        })}

        {/* Hero hand (center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl font-bold tracking-wide text-white">
            {spot.heroHand}
          </div>
        </div>
      </div>

      {/* Action history */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {getActionHistory(spot).map((action, i) => (
          <span
            key={i}
            className="rounded-full bg-neutral-800/80 px-2.5 py-0.5 text-xs text-neutral-400"
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
