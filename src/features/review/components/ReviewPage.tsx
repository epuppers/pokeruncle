import { cn } from '@/lib/utils'
import { useReviewStore } from '@/stores/reviewStore'

import { HandBrowser } from './HandBrowser'
import { StatsDashboard } from './StatsDashboard'

const TABS = [
  { id: 'dashboard', label: 'Your Stats' },
  { id: 'history', label: 'Hand History' },
] as const

export function ReviewPage() {
  const { activeTab, setActiveTab } = useReviewStore()

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border/50 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-t-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-brass bg-secondary/50'
                : 'text-muted-foreground hover:text-foreground',
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
