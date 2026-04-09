import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Position, Scenario } from '@/types/poker'

import type { SpotFilters, StackDepth, TournamentScenario } from '@/features/trainer/types'

interface DrillLauncherProps {
  filters: SpotFilters
  drillCount: string
  setDrillCount: (v: string) => void
  startDrill: (scenario: Scenario, hero: Position, total: number, villain?: Position) => void
}

export function DrillLauncher({
  filters,
  drillCount,
  setDrillCount,
  startDrill,
}: DrillLauncherProps) {
  const canDrill = filters.scenarios.length === 1 && filters.positions.length === 1
  const count = Math.max(1, parseInt(drillCount, 10) || 50)

  return (
    <div className="flex items-center gap-2 border-t border-border pt-3">
      <Input
        type="number"
        min={1}
        max={500}
        value={drillCount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrillCount(e.target.value)}
        className="h-8 w-20 text-xs"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={!canDrill}
        onClick={() => {
          if (!canDrill) return
          startDrill(filters.scenarios[0], filters.positions[0], count)
        }}
      >
        Start Drill
      </Button>
      {!canDrill && (
        <span className="text-xs text-muted-foreground">Pick 1 position + 1 scenario to drill</span>
      )}
    </div>
  )
}

interface PushFoldDrillLauncherProps {
  filters: SpotFilters
  drillCount: string
  setDrillCount: (v: string) => void
  startPushFoldDrill: (
    scenario: TournamentScenario,
    hero: Position,
    total: number,
    stackDepth: StackDepth,
    villain?: Position,
  ) => void
}

export function PushFoldDrillLauncher({
  filters,
  drillCount,
  setDrillCount,
  startPushFoldDrill,
}: PushFoldDrillLauncherProps) {
  const canDrill = filters.positions.length === 1 && filters.stackDepths.length === 1
  const count = Math.max(1, parseInt(drillCount, 10) || 50)

  return (
    <div className="flex items-center gap-2 border-t border-border pt-3">
      <Input
        type="number"
        min={1}
        max={500}
        value={drillCount}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrillCount(e.target.value)}
        className="h-8 w-20 text-xs"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={!canDrill}
        onClick={() => {
          if (!canDrill) return
          startPushFoldDrill('push', filters.positions[0], count, filters.stackDepths[0])
        }}
      >
        Start Drill
      </Button>
      {!canDrill && (
        <span className="text-xs text-muted-foreground">Pick 1 position + 1 stack depth to drill</span>
      )}
    </div>
  )
}
