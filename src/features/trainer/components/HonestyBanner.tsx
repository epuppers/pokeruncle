import { hasMixedStrategies } from '@/features/trainer/lib/chart-utils'
import type { ProviderCharts } from '@/features/trainer/types'

interface HonestyBannerProps {
  charts: ProviderCharts
}

export function HonestyBanner({ charts }: HonestyBannerProps) {
  if (hasMixedStrategies(charts)) return null

  return (
    <div className="rounded-lg border border-brass/20 bg-brass/5 px-4 py-2 text-xs text-brass-dim">
      This chart pack uses simple yes-or-no decisions. For practice with mixed strategies
      (where the correct play varies each time), try a different chart pack.
    </div>
  )
}
