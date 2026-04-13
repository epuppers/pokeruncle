import type { SpotFilters } from '@/features/trainer/types'

export function toggleFilter<K extends keyof SpotFilters>(
  filters: SpotFilters,
  setFilters: (f: SpotFilters) => void,
  key: K,
  value: SpotFilters[K][number],
) {
  const current = filters[key] as SpotFilters[K][number][]
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  setFilters({ ...filters, [key]: next })
}
