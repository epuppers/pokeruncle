import { cn } from '@/lib/utils'
import { useReviewStore } from '@/stores/reviewStore'

import { HandBrowser } from './HandBrowser'
import { StatsDashboard } from './StatsDashboard'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'Hand History' },
] as const

export function ReviewPage() {
  const { activeTab, setActiveTab } = useReviewStore()

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-neutral-800/50 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-t-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-white bg-neutral-800/50'
                : 'text-neutral-500 hover:text-neutral-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' ? <StatsDashboard /> : <HandBrowser />}
    </div>
  )
}
