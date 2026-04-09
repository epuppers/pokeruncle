import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod/v4'
import { POSITIONS, PROVIDERS } from '@/types/poker'

import type { ReviewFilters } from '@/features/review/types'

const SCENARIOS = ['RFI', 'vs-open', 'vs-3bet', 'vs-4bet', '3bet-defense'] as const
const TIME_RANGES = ['all', '7d', '30d', 'today'] as const

const reviewStateSchema = z.object({
  filters: z.object({
    provider: z.enum(PROVIDERS).nullable(),
    positions: z.array(z.enum(POSITIONS)),
    scenarios: z.array(z.enum(SCENARIOS)),
    onlyWrong: z.boolean(),
    timeRange: z.enum(TIME_RANGES),
  }),
  activeTab: z.enum(['dashboard', 'history']),
})

interface ReviewState {
  filters: ReviewFilters
  activeTab: 'dashboard' | 'history'
  setFilters: (partial: Partial<ReviewFilters>) => void
  setActiveTab: (tab: 'dashboard' | 'history') => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: ReviewFilters = {
  provider: null,
  positions: [],
  scenarios: [],
  onlyWrong: false,
  timeRange: 'all',
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      activeTab: 'dashboard' as const,

      setFilters: (partial) =>
        set((state) => ({ filters: { ...state.filters, ...partial } })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'poker-review',
      partialize: (state) => ({
        filters: state.filters,
        activeTab: state.activeTab,
      }),
      merge: (persisted, current) => {
        const parsed = reviewStateSchema.safeParse(persisted)
        if (!parsed.success) return current
        return {
          ...current,
          filters: parsed.data.filters as ReviewFilters,
          activeTab: parsed.data.activeTab,
        }
      },
    },
  ),
)
