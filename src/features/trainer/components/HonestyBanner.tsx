import { hasMixedStrategies } from '@/features/trainer/lib/chart-utils'
import type { ProviderCharts } from '@/features/trainer/types'

interface HonestyBannerProps {
  charts: ProviderCharts
}

export function HonestyBanner({ charts }: HonestyBannerProps) {
  if (hasMixedStrategies(charts)) return null

  return (
    <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-400/80">
      This provider uses pure strategies. For mixed-strategy training, switch to a provider
      with full GTO frequencies.
    </div>
  )
}
