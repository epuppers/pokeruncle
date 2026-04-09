import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { Position } from '@/types/poker'
import { cn } from '@/lib/utils'
import { PokerTerm } from '@/components/PokerTerm'
import { POSITION_LABELS, SCENARIO_LABELS, TOURNAMENT_SCENARIO_LABELS, positionLabel } from '@/lib/poker-glossary'

import { TOURNAMENT_SCENARIO_CONFIGS } from '@/features/trainer/types'
import type { Spot } from '@/features/trainer/types'
import { HeroHand } from './HeroHand'

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

/** Build a map of what each position did in this hand so far. */
function getPositionActions(spot: Spot): Map<Position, { action: string; style: 'bet' | 'fold' | 'raise' | 'hero' }> {
  const actions = new Map<Position, { action: string; style: 'bet' | 'fold' | 'raise' | 'hero' }>()

  // Blinds always post
  actions.set('SB', { action: '½ bet', style: 'bet' })
  actions.set('BB', { action: '1 bet', style: 'bet' })

  if (spot.kind === 'push-fold') {
    return getPushFoldPositionActions(spot, actions)
  }

  const heroPos = spot.hero
  const posOrder: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']

  switch (spot.scenario) {
    case 'RFI': {
      // Everyone before hero folds
      for (const pos of posOrder) {
        if (pos === heroPos) break
        if (pos !== 'SB' && pos !== 'BB') {
          actions.set(pos, { action: 'folds', style: 'fold' })
        }
      }
      actions.set(heroPos, { action: 'YOUR TURN', style: 'hero' })
      break
    }
    case 'vs-open': {
      if (spot.kind === 'response') {
        actions.set(spot.villain, { action: 'raises', style: 'raise' })
        actions.set(heroPos, { action: 'YOUR TURN', style: 'hero' })
      }
      break
    }
    case 'vs-3bet': {
      if (spot.kind === 'response') {
        actions.set(heroPos, { action: 'raised', style: 'raise' })
        actions.set(spot.villain, { action: 're-raises', style: 'raise' })
        // Override hero — they need to act again
        actions.set(heroPos, { action: 'YOUR TURN', style: 'hero' })
      }
      break
    }
    case 'vs-4bet': {
      if (spot.kind === 'response') {
        actions.set(spot.villain, { action: 'raised', style: 'raise' })
        actions.set(heroPos, { action: 'YOUR TURN', style: 'hero' })
      }
      break
    }
    case '3bet-defense': {
      if (spot.kind === 'response') {
        actions.set(spot.villain, { action: 'calls', style: 'bet' })
        actions.set(heroPos, { action: 'YOUR TURN', style: 'hero' })
      }
      break
    }
  }

  return actions
}

function getPushFoldPositionActions(
  spot: Spot & { kind: 'push-fold' },
  actions: Map<Position, { action: string; style: 'bet' | 'fold' | 'raise' | 'hero' }>,
): Map<Position, { action: string; style: 'bet' | 'fold' | 'raise' | 'hero' }> {
  if (spot.scenario === 'push') {
    actions.set(spot.hero, { action: 'YOUR TURN', style: 'hero' })
  } else {
    if (spot.villain) {
      actions.set(spot.villain, { action: 'ALL-IN', style: 'raise' })
    }
    actions.set(spot.hero, { action: 'YOUR TURN', style: 'hero' })
  }
  return actions
}

export function TableView({ spot }: TableViewProps) {
  const villain = spot.kind === 'response' ? spot.villain : spot.kind === 'push-fold' ? spot.villain : undefined
  const stackLabel = getStackLabel(spot)
  const scenarioInfo = getScenarioLabel(spot)
  const positionActions = getPositionActions(spot)

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Scenario label */}
      <div className="text-base font-semibold text-muted-foreground">
        <PokerTerm label={scenarioInfo.label} tip={scenarioInfo.tip} />
      </div>

      {/* Table */}
      <div className="relative w-full max-w-lg aspect-[3/2] rounded-[40%] ring-4 ring-wood bg-[radial-gradient(ellipse_at_center,var(--color-felt-light),var(--color-felt))] shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3)]">
        {/* Position labels with action badges */}
        {POSITIONS.map((pos) => {
          const { x, y } = POSITION_ANGLES[pos]
          const isHero = pos === spot.hero
          const isVillain = pos === villain
          const entry = POSITION_LABELS[pos]
          const posAction = positionActions.get(pos)
          const isFolded = posAction?.style === 'fold'

          return (
            <div
              key={pos}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors',
                  isHero && 'bg-brass/25 text-brass ring-2 ring-brass/50 scale-110 animate-pulse',
                  isVillain && 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40',
                  isFolded && 'opacity-30',
                  !isHero && !isVillain && !isFolded && 'text-muted-foreground',
                )}
              >
                {/* "YOU" badge for hero */}
                {isHero && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-brass">
                    You
                  </span>
                )}
                <PokerTerm label={entry.label} tip={entry.tip} className="text-inherit border-0" />
                {/* Action badge */}
                {posAction && (
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5',
                      posAction.style === 'hero' && 'bg-brass/30 text-brass',
                      posAction.style === 'raise' && 'bg-rose-500/20 text-rose-300',
                      posAction.style === 'bet' && 'bg-foreground/10 text-muted-foreground',
                      posAction.style === 'fold' && 'text-muted-foreground/50',
                    )}
                  >
                    {posAction.action}
                  </span>
                )}
                {!posAction && (
                  <span className="text-[10px] tabular-nums opacity-40">{stackLabel}</span>
                )}
              </div>
            </div>
          )
        })}

        {/* Hero cards (center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <HeroHand cards={spot.heroCards} />
        </div>
      </div>
    </div>
  )
}
