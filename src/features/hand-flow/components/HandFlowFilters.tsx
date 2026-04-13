import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { POSITION_LABELS, SCENARIO_LABELS } from '@/lib/poker-glossary'
import { useTrainerStore } from '@/stores/trainerStore'
import { POSITIONS, SCENARIOS } from '@/types/poker'

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

/**
 * Filter panel for the /play hand flow page.
 * Reads/writes trainerStore.filters (shared with the dealer hook).
 */
export function HandFlowFilters() {
  const filters = useTrainerStore((s) => s.filters)
  const setFilters = useTrainerStore((s) => s.setFilters)
  const [expanded, setExpanded] = useState(false)

  const hasActiveFilters =
    filters.positions.length > 0 ||
    filters.scenarios.length > 0 ||
    filters.handTypes.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
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
