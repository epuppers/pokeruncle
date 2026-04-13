import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { POSITION_LABELS, SCENARIO_LABELS } from '@/lib/poker-glossary'
import { useHandStore } from '@/stores/handStore'
import { useTrainerStore } from '@/stores/trainerStore'
import { POSITIONS, SCENARIOS } from '@/types/poker'

import type { HandFlowMode } from '@/stores/handStore'
import type { HandType } from '@/types/poker'

import {
  FilterSection,
  ToggleChip,
  ToggleChipWithTip,
  toggleFilter,
} from '@/features/trainer'

const HAND_TYPES: { id: HandType; label: string }[] = [
  { id: 'pair', label: 'Pairs' },
  { id: 'suited', label: 'Suited' },
  { id: 'offsuit', label: 'Offsuit' },
]

const MODES: { mode: HandFlowMode; label: string }[] = [
  { mode: { mode: 'natural' }, label: 'Natural' },
  { mode: { mode: 'postflop-drill' }, label: 'Postflop Drill' },
]

/**
 * Filter panel and mode toggle for the /play hand flow page.
 * Reads/writes trainerStore.filters (shared with the dealer hook)
 * and handStore.handFlowMode.
 */
export function HandFlowFilters() {
  const provider = useTrainerStore((s) => s.provider)
  const filters = useTrainerStore((s) => s.filters)
  const setFilters = useTrainerStore((s) => s.setFilters)
  const handFlowMode = useHandStore((s) => s.handFlowMode)
  const setHandFlowMode = useHandStore((s) => s.setHandFlowMode)
  const nextHand = useHandStore((s) => s.nextHand)
  const [expanded, setExpanded] = useState(false)

  const isTournament = provider === 'nash-pushfold'

  const hasActiveFilters =
    filters.positions.length > 0 ||
    filters.scenarios.length > 0 ||
    filters.handTypes.length > 0

  function handleModeChange(newMode: HandFlowMode) {
    if (newMode.mode === handFlowMode.mode) return
    setHandFlowMode(newMode)
    nextHand()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isTournament && (
          <ModeToggle currentMode={handFlowMode} onModeChange={handleModeChange} />
        )}
        <Button
          variant={expanded ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide Filters' : 'Filter Spots'}
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
        </div>
      )}
    </div>
  )
}

function ModeToggle({
  currentMode,
  onModeChange,
}: {
  currentMode: HandFlowMode
  onModeChange: (mode: HandFlowMode) => void
}) {
  return (
    <div className="flex rounded-md border border-border">
      {MODES.map(({ mode, label }) => (
        <button
          key={mode.mode}
          type="button"
          onClick={() => onModeChange(mode)}
          className={cn(
            'px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md',
            currentMode.mode === mode.mode
              ? 'bg-brass/20 text-brass'
              : 'text-muted-foreground hover:bg-accent/30',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
