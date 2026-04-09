import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { Position } from '@/types/poker'
import { cn } from '@/lib/utils'
import { PokerTerm } from '@/components/PokerTerm'
import { POSITION_LABELS, SCENARIO_LABELS, TOURNAMENT_SCENARIO_LABELS, positionLabel } from '@/lib/poker-glossary'

import { TOURNAMENT_SCENARIO_CONFIGS } from '@/features/trainer/types'
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

function getScenarioLabel(spot: Spot): { label: string; tip: string } {
  if (spot.kind === 'push-fold') {
    const config = TOURNAMENT_SCENARIO_CONFIGS.find((s) => s.id === spot.scenario)
    const entry = TOURNAMENT_SCENARIO_LABELS[spot.scenario]
    const label = entry?.label ?? config?.label ?? spot.scenario
    const tip = entry?.tip ?? ''
    const depthStr = `${spot.stackDepth} big blinds`
    const villainStr = spot.villain ? ` vs ${positionLabel(spot.villain)}` : ''
    return { label: `${label}${villainStr} — ${depthStr}`, tip }
  }

  const entry = SCENARIO_LABELS[spot.scenario]
  const config = SCENARIOS.find((s) => s.id === spot.scenario)
  if (!entry && !config) return { label: spot.scenario, tip: '' }

  const label = entry?.label ?? config?.label ?? spot.scenario
  const tip = entry?.tip ?? ''

  if (spot.kind === 'response') {
    return { label: `${label} (${positionLabel(spot.villain)})`, tip }
  }
  return { label, tip }
}

function getStackLabel(spot: Spot): string {
  if (spot.kind === 'push-fold') return `${spot.stackDepth} blinds`
  return '100 blinds'
}

function getActionHistory(spot: Spot): string[] {
  if (spot.kind === 'push-fold') {
    return getPushFoldActionHistory(spot)
  }

  const actions: string[] = ['Small Blind posts half a bet', 'Big Blind posts one bet']

  switch (spot.scenario) {
    case 'RFI':
      actions.push(`Everyone folds to you (${positionLabel(spot.hero)})`)
      break
    case 'vs-open':
      if (spot.kind === 'response') {
        actions.push(`${positionLabel(spot.villain)} raises`)
        actions.push(`Your turn (${positionLabel(spot.hero)})`)
      }
      break
    case 'vs-3bet':
      if (spot.kind === 'response') {
        actions.push(`You raise (${positionLabel(spot.hero)})`)
        actions.push(`${positionLabel(spot.villain)} re-raises`)
        actions.push(`Your turn`)
      }
      break
    case 'vs-4bet':
      if (spot.kind === 'response') {
        actions.push(`${positionLabel(spot.villain)} raises`)
        actions.push(`You re-raise (${positionLabel(spot.hero)})`)
        actions.push(`${positionLabel(spot.villain)} raises again`)
        actions.push(`Your turn`)
      }
      break
    case '3bet-defense':
      if (spot.kind === 'response') {
        actions.push(`${positionLabel(spot.villain)} raises`)
        actions.push(`You re-raise (${positionLabel(spot.hero)})`)
        actions.push(`${positionLabel(spot.villain)} calls`)
        actions.push(`Your turn`)
      }
      break
  }

  return actions
}

function getPushFoldActionHistory(spot: Spot & { kind: 'push-fold' }): string[] {
  const actions: string[] = ['Small Blind posts half a bet', 'Big Blind posts one bet']

  if (spot.scenario === 'push') {
    actions.push(`Everyone folds to you (${positionLabel(spot.hero)})`)
    actions.push(`Go all-in or fold?`)
  } else {
    if (spot.villain) {
      actions.push(`${positionLabel(spot.villain)} goes all-in`)
    }
    actions.push(`Your turn (${positionLabel(spot.hero)})`)
  }

  return actions
}

export function TableView({ spot }: TableViewProps) {
  const villain = spot.kind === 'response' ? spot.villain : spot.kind === 'push-fold' ? spot.villain : undefined
  const stackLabel = getStackLabel(spot)
  const scenarioInfo = getScenarioLabel(spot)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scenario label */}
      <div className="text-sm font-medium text-muted-foreground">
        <PokerTerm label={scenarioInfo.label} tip={scenarioInfo.tip} />
      </div>

      {/* Table */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-[40%] ring-4 ring-wood bg-[radial-gradient(ellipse_at_center,var(--color-felt-light),var(--color-felt))] shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]">
        {/* Position labels */}
        {POSITIONS.map((pos) => {
          const { x, y } = POSITION_ANGLES[pos]
          const isHero = pos === spot.hero
          const isVillain = pos === villain
          const entry = POSITION_LABELS[pos]

          return (
            <div
              key={pos}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  isHero && 'bg-brass/20 text-brass ring-1 ring-brass/40',
                  isVillain && 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40',
                  !isHero && !isVillain && 'text-muted-foreground',
                )}
              >
                <PokerTerm label={entry.label} tip={entry.tip} className="text-inherit border-0" />
                <span className="text-[10px] tabular-nums opacity-60">{stackLabel}</span>
              </div>
            </div>
          )
        })}

        {/* Hero hand (center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-display text-4xl font-bold tracking-wide text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {spot.heroHand}
          </div>
        </div>
      </div>

      {/* Action history */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {getActionHistory(spot).map((action, i) => (
          <span
            key={i}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
