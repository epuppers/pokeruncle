import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useReviewStore } from '@/stores/reviewStore'

import { PAGE_SIZE, useSpotHistory } from '../hooks/use-spot-history'
import { HandBrowserRow } from './HandBrowserRow'
import { ReviewFilters } from './ReviewFilters'

export function HandBrowser() {
  const { filters, setFilters, resetFilters } = useReviewStore()
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { results, totalCount, isLoading } = useSpotHistory(filters, page)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReviewFilters filters={filters} onFiltersChange={(partial) => { setFilters(partial); setPage(0) }} onReset={() => { resetFilters(); setPage(0) }} />

      <div className="text-neutral-500 text-xs">
        {totalCount} spot{totalCount !== 1 ? 's' : ''} found
      </div>

      {results.length === 0 ? (
        <div className="text-neutral-500 text-sm text-center py-8">
          No matching spots. Adjust your filters or train more.
        </div>
      ) : (
        <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg overflow-hidden">
          {results.map((r) => (
            <HandBrowserRow
              key={r.id}
              result={r}
              isExpanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Prev
          </Button>
          <span className="text-neutral-400 text-sm tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
