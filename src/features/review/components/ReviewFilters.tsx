import { Button } from '@/components/ui/button'
import { POSITIONS, PROVIDERS, SCENARIOS, type Position, type Scenario } from '@/types/poker'
import { POSITION_LABELS, SCENARIO_LABELS } from '@/lib/poker-glossary'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

import type { ReviewFilters as ReviewFiltersType, TimeRange } from '../types'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: '30 days' },
  { value: '7d', label: '7 days' },
  { value: 'today', label: 'Today' },
]

interface ReviewFiltersProps {
  filters: ReviewFiltersType
  onFiltersChange: (partial: Partial<ReviewFiltersType>) => void
  onReset: () => void
}

export function ReviewFilters({ filters, onFiltersChange, onReset }: ReviewFiltersProps) {
  function togglePosition(pos: Position) {
    const current = filters.positions
    const next = current.includes(pos) ? current.filter((p) => p !== pos) : [...current, pos]
    onFiltersChange({ positions: next })
  }

  function toggleScenario(sc: Scenario) {
    const current = filters.scenarios
    const next = current.includes(sc) ? current.filter((s) => s !== sc) : [...current, sc]
    onFiltersChange({ scenarios: next })
  }

  const hasActiveFilters =
    filters.provider !== null ||
    filters.positions.length > 0 ||
    filters.scenarios.length > 0 ||
    filters.onlyWrong ||
    filters.timeRange !== 'all'

  return (
    <div className="space-y-3">
      {/* Row 1: Provider + Time range + Mistakes only + Reset */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.provider ?? ''}
          onChange={(e) => onFiltersChange({ provider: (e.target.value || null) as ReviewFiltersType['provider'] })}
          className="h-8 rounded-md border border-border bg-input px-2 text-sm text-foreground"
        >
          <option value="">All chart packs</option>
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filters.timeRange}
          onChange={(e) => onFiltersChange({ timeRange: e.target.value as TimeRange })}
          className="h-8 rounded-md border border-border bg-input px-2 text-sm text-foreground"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <Button
          variant={filters.onlyWrong ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({ onlyWrong: !filters.onlyWrong })}
        >
          Mistakes Only
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            Reset
          </Button>
        )}
      </div>

      {/* Row 2: Position toggles */}
      <div className="flex flex-wrap gap-1">
        {POSITIONS.map((pos) => {
          const entry = POSITION_LABELS[pos]
          return (
            <Tooltip key={pos}>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.positions.includes(pos) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePosition(pos)}
                  className="h-7 px-2 text-xs"
                >
                  {entry.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                <p>{entry.tip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Row 3: Scenario toggles */}
      <div className="flex flex-wrap gap-1">
        {SCENARIOS.map((sc) => {
          const entry = SCENARIO_LABELS[sc.id]
          return (
            <Tooltip key={sc.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={filters.scenarios.includes(sc.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleScenario(sc.id)}
                  className="h-7 px-2 text-xs"
                >
                  {entry.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                <p>{entry.tip}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
