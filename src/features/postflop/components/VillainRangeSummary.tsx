import { useCallback, useMemo } from 'react'

import { HandGrid } from '@/components/chart/HandGrid'
import { getVillainRange } from '@/data/villain-ranges'

import type { VillainRangeNode } from '@/data/villain-ranges/types'
import type { Cell } from '@/types/poker'

import { describeVillainRange } from '../lib/range-summary'

interface VillainRangeSummaryProps {
  preflopNode: VillainRangeNode
}

/**
 * Displays the villain's preflop continuing range as a compact 13x13 grid.
 * Used in the feedback view to show what hands the villain could have.
 */
export function VillainRangeSummary({ preflopNode }: VillainRangeSummaryProps) {
  const chart = useMemo(() => getVillainRange(preflopNode), [preflopNode])

  const handCount = useMemo(
    () => (chart ? Object.keys(chart).length : 0),
    [chart],
  )

  const getCell = useCallback(
    (hand: string): Cell => {
      if (!chart) return 'fold'
      return chart[hand] ?? 'fold'
    },
    [chart],
  )

  if (!chart) return null

  const title = describeVillainRange(preflopNode, handCount)

  return (
    <HandGrid
      getCell={getCell}
      compact
      title="Villain's Range"
      subtitle={title}
    />
  )
}
