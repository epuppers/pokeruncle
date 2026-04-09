import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTrainerStore } from '@/stores/trainerStore'
import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { HandType, Position, Scenario } from '@/types/poker'

import type { SpotFilters as SpotFiltersType } from '@/features/trainer/types'

const HAND_TYPES: { id: HandType; label: string }[] = [
  { id: 'pair', label: 'Pairs' },
  { id: 'suited', label: 'Suited' },
  { id: 'offsuit', label: 'Offsuit' },
]

export function SpotFilters() {
  const filters = useTrainerStore((s) => s.filters)
  const setFilters = useTrainerStore((s) => s.setFilters)
  const trainerMode = useTrainerStore((s) => s.trainerMode)
  const startDrill = useTrainerStore((s) => s.startDrill)
  const endDrill = useTrainerStore((s) => s.endDrill)
  const [expanded, setExpanded] = useState(false)
  const [drillCount, setDrillCount] = useState('50')

  const hasActiveFilters =
    filters.positions.length > 0 || filters.scenarios.length > 0 || filters.handTypes.length > 0

  if (trainerMode.mode === 'drill') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Drilling: {trainerMode.hero} {trainerMode.scenario}
          {trainerMode.villain ? ` vs ${trainerMode.villain}` : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={endDrill}>
          Stop
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant={expanded ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          Filters{hasActiveFilters ? ' (active)' : ''}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ positions: [], scenarios: [], handTypes: [] })}
          >
            Clear
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 rounded-md border p-3">
          <FilterSection label="Position">
            {POSITIONS.map((pos) => (
              <ToggleChip
                key={pos}
                label={pos}
                active={filters.positions.includes(pos)}
                onClick={() => toggleFilter(filters, setFilters, 'positions', pos)}
              />
            ))}
          </FilterSection>

          <FilterSection label="Scenario">
            {SCENARIOS.map((s) => (
              <ToggleChip
                key={s.id}
                label={s.label}
                active={filters.scenarios.includes(s.id)}
                onClick={() => toggleFilter(filters, setFilters, 'scenarios', s.id)}
              />
            ))}
          </FilterSection>

          <FilterSection label="Hand type">
            {HAND_TYPES.map((ht) => (
              <ToggleChip
                key={ht.id}
                label={ht.label}
                active={filters.handTypes.includes(ht.id)}
                onClick={() => toggleFilter(filters, setFilters, 'handTypes', ht.id)}
              />
            ))}
          </FilterSection>

          <DrillLauncher
            filters={filters}
            drillCount={drillCount}
            setDrillCount={setDrillCount}
            startDrill={startDrill}
          />
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-0.5 text-xs transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-accent',
      )}
    >
      {label}
    </button>
  )
}

function toggleFilter<K extends keyof SpotFiltersType>(
  filters: SpotFiltersType,
  setFilters: (f: SpotFiltersType) => void,
  key: K,
  value: SpotFiltersType[K][number],
) {
  const current = filters[key] as SpotFiltersType[K][number][]
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  setFilters({ ...filters, [key]: next })
}

function DrillLauncher({
  filters,
  drillCount,
  setDrillCount,
  startDrill,
}: {
  filters: SpotFiltersType
  drillCount: string
  setDrillCount: (v: string) => void
  startDrill: (scenario: Scenario, hero: Position, total: number, villain?: Position) => void
}) {
  const canDrill = filters.scenarios.length === 1 && filters.positions.length === 1
  const count = Math.max(1, parseInt(drillCount, 10) || 50)

  return (
    <div className="flex items-center gap-2 border-t pt-2">
      <Input
        type="number"
        min={1}
        max={500}
        value={drillCount}
        onChange={(e) => setDrillCount(e.target.value)}
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
        Start drill
      </Button>
      {!canDrill && (
        <span className="text-xs text-muted-foreground">Select 1 position + 1 scenario</span>
      )}
    </div>
  )
}
