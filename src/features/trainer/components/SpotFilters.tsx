import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTrainerStore } from '@/stores/trainerStore'
import { POSITIONS, SCENARIOS } from '@/types/poker'
import type { HandType } from '@/types/poker'
import { POSITION_LABELS, SCENARIO_LABELS, positionLabel, scenarioLabel, tournamentScenarioLabel } from '@/lib/poker-glossary'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

import {
  STACK_DEPTHS,
  TOURNAMENT_SCENARIO_CONFIGS,
} from '@/features/trainer/types'
import type { SpotFilters as SpotFiltersType } from '@/features/trainer/types'
import { DrillLauncher, PushFoldDrillLauncher } from './DrillLauncher'

const HAND_TYPES: { id: HandType; label: string }[] = [
  { id: 'pair', label: 'Pairs' },
  { id: 'suited', label: 'Suited' },
  { id: 'offsuit', label: 'Offsuit' },
]

export function SpotFilters() {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const setFilters = useTrainerStore((s) => s.setFilters)
  const trainerMode = useTrainerStore((s) => s.trainerMode)
  const startDrill = useTrainerStore((s) => s.startDrill)
  const startPushFoldDrill = useTrainerStore((s) => s.startPushFoldDrill)
  const endDrill = useTrainerStore((s) => s.endDrill)
  const [expanded, setExpanded] = useState(false)
  const [drillCount, setDrillCount] = useState('50')

  const isTournament = provider === 'nash-pushfold'

  const hasActiveFilters =
    filters.positions.length > 0 ||
    filters.scenarios.length > 0 ||
    filters.handTypes.length > 0 ||
    filters.stackDepths.length > 0

  if (trainerMode.mode === 'drill') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Drilling: {positionLabel(trainerMode.hero)} {scenarioLabel(trainerMode.scenario)}
          {trainerMode.villain ? ` vs ${positionLabel(trainerMode.villain)}` : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={endDrill}>
          Stop
        </Button>
      </div>
    )
  }

  if (trainerMode.mode === 'push-fold-drill') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Drilling: {positionLabel(trainerMode.hero)} {tournamentScenarioLabel(trainerMode.scenario)} at {trainerMode.stackDepth} big blinds
          {trainerMode.villain ? ` vs ${positionLabel(trainerMode.villain)}` : ''}
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
          {expanded ? 'Hide Options' : 'Choose What to Practice'}
          {hasActiveFilters ? ' (filtered)' : ''}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({ positions: [], scenarios: [], handTypes: [], stackDepths: [] })
            }
          >
            Clear
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
          <FilterSection label="Position">
            {POSITIONS.map((pos) => {
              const entry = POSITION_LABELS[pos]
              return (
                <ToggleChipWithTip
                  key={pos}
                  label={entry.label}
                  tip={entry.tip}
                  active={filters.positions.includes(pos)}
                  onClick={() => toggleFilter(filters, setFilters, 'positions', pos)}
                />
              )
            })}
          </FilterSection>

          {isTournament ? (
            <>
              <FilterSection label="Scenario">
                {TOURNAMENT_SCENARIO_CONFIGS.map((s) => (
                  <ToggleChip
                    key={s.id}
                    label={tournamentScenarioLabel(s.id)}
                    active={false}
                    onClick={() => {
                      /* Tournament scenario filtering is handled via drill mode */
                    }}
                  />
                ))}
              </FilterSection>

              <FilterSection label="Stack Size">
                {STACK_DEPTHS.map((d) => (
                  <ToggleChip
                    key={d}
                    label={`${d} blinds`}
                    active={filters.stackDepths.includes(d)}
                    onClick={() => toggleFilter(filters, setFilters, 'stackDepths', d)}
                  />
                ))}
              </FilterSection>
            </>
          ) : (
            <FilterSection label="Scenario">
              {SCENARIOS.map((s) => {
                const entry = SCENARIO_LABELS[s.id]
                return (
                  <ToggleChipWithTip
                    key={s.id}
                    label={entry.label}
                    tip={entry.tip}
                    active={filters.scenarios.includes(s.id)}
                    onClick={() => toggleFilter(filters, setFilters, 'scenarios', s.id)}
                  />
                )
              })}
            </FilterSection>
          )}

          <FilterSection label="Hand Type">
            {HAND_TYPES.map((ht) => (
              <ToggleChip
                key={ht.id}
                label={ht.label}
                active={filters.handTypes.includes(ht.id)}
                onClick={() => toggleFilter(filters, setFilters, 'handTypes', ht.id)}
              />
            ))}
          </FilterSection>

          {isTournament ? (
            <PushFoldDrillLauncher
              filters={filters}
              drillCount={drillCount}
              setDrillCount={setDrillCount}
              startPushFoldDrill={startPushFoldDrill}
            />
          ) : (
            <DrillLauncher
              filters={filters}
              drillCount={drillCount}
              setDrillCount={setDrillCount}
              startDrill={startDrill}
            />
          )}
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
          ? 'border-brass bg-brass/20 text-brass'
          : 'border-border bg-background text-muted-foreground hover:bg-accent/30',
      )}
    >
      {label}
    </button>
  )
}

function ToggleChipWithTip({
  label,
  tip,
  active,
  onClick,
}: {
  label: string
  tip: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'rounded-md border px-2 py-0.5 text-xs transition-colors',
            active
              ? 'border-brass bg-brass/20 text-brass'
              : 'border-border bg-background text-muted-foreground hover:bg-accent/30',
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
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
