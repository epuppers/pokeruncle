import { SCENARIOS } from '@/types/poker'

import { parseChartKey } from '@/features/trainer/lib/chart-utils'
import type { ProviderCharts } from '@/features/trainer/types'

interface ChartSummaryProps {
  charts: ProviderCharts
}

export function ChartSummary({ charts }: ChartSummaryProps) {
  const keys = Object.keys(charts)
  const parsed = keys.map(parseChartKey).filter(
    (p): p is NonNullable<typeof p> => p !== null,
  )

  const positions = new Set(parsed.map((p) => p.hero))
  const scenarios = new Set(parsed.map((p) => p.scenario))

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Provider Coverage</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-white">{keys.length}</div>
          <div className="text-xs text-neutral-500">Charts</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-white">{positions.size}</div>
          <div className="text-xs text-neutral-500">Positions</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-white">{scenarios.size}</div>
          <div className="text-xs text-neutral-500">Scenarios</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SCENARIOS.filter((s) => scenarios.has(s.id)).map((s) => (
          <span
            key={s.id}
            className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-400"
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
