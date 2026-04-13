/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createRouter, createRootRoute, createRoute, Link, Outlet } from '@tanstack/react-router'
import { Spade, Settings } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OnboardingOverlay } from '@/features/onboarding'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { HandGrid } from '@/components/chart/HandGrid'
import { ChartControls } from '@/components/ChartControls'
import { Legend } from '@/components/Legend'
import { ProviderSelector } from '@/components/ProviderSelector'
import { getCellWithCascadedWeight } from '@/data/ranges'
import { useChartStore } from '@/stores/chartStore'
import { POSITIONS, SCENARIOS, type Position, type Scenario } from '@/types/poker'

// Lazy-loaded route components
const TrainerPage = lazy(() => import('@/features/trainer').then(m => ({ default: m.TrainerPage })))
const AnalyzerPage = lazy(() => import('@/components/analyze/AnalyzerPage').then(m => ({ default: m.AnalyzerPage })))
const DisclaimerPage = lazy(() => import('@/components/DisclaimerPage').then(m => ({ default: m.DisclaimerPage })))
const ReviewPage = lazy(() => import('@/features/review').then(m => ({ default: m.ReviewPage })))
const SettingsPage = lazy(() => import('@/features/settings').then(m => ({ default: m.SettingsPage })))
const PostflopTrainerPage = lazy(() => import('@/features/postflop').then(m => ({ default: m.PostflopTrainerPage })))
const HandFlowPage = lazy(() => import('@/features/hand-flow').then(m => ({ default: m.HandFlowPage })))

// Root layout component
function RootLayout() {
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Ambient background gradients — warm lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-3 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link to="/play" className="flex items-center gap-2 group">
            <Spade className="size-5 text-brass fill-brass/20 transition-transform group-hover:scale-110" />
            <h1 className="font-display text-lg font-bold tracking-wide">
              <span className="bg-gradient-to-r from-brass to-brass-dim bg-clip-text text-transparent">
                Uncle&apos;s Table
              </span>
            </h1>
          </Link>

          {/* Navigation tabs */}
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <NavLink to="/play" label="Play" />
            <NavLink to="/train" label="Preflop" />
            <NavLink to="/train/postflop" label="Postflop" />
            <NavLink to="/review" label="Review" />
            <NavLink to="/" label="Ranges" exact />
            <NavLink to="/analyze" label="Analyze" />
            <Link
              to="/settings"
              className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-brass' }}
              aria-label="Settings"
            >
              <Settings className="size-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Brass rail divider */}
      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />

      {/* Main content */}
      <main className="relative z-10 flex-1 p-4 flex flex-col overflow-auto">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-border border-t-brass rounded-full animate-spin" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-3 border-t border-border/50 text-center text-xs text-muted-foreground">
        Poker strategy study tool. Not for use during live play.
        {' '}<Link to="/disclaimer" className="underline underline-offset-2 hover:text-brass-dim transition-colors">Disclaimer</Link>
      </footer>

      {/* Onboarding overlay (first-run only) */}
      {!hasCompletedOnboarding && <OnboardingOverlay />}
    </div>
  )
}

function NavLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        'text-muted-foreground hover:text-foreground'
      )}
      activeProps={{
        className: 'bg-secondary text-brass border-b-2 border-brass',
        'aria-current': 'page',
      }}
    >
      {label}
    </Link>
  )
}

// Get available scenarios for a hero/villain pair
function getAvailableScenarios(hero: string, villain: string | null): Scenario[] {
  const heroIdx = POSITIONS.indexOf(hero as Position)
  const villainIdx = villain ? POSITIONS.indexOf(villain as Position) : -1

  const scenarios: Scenario[] = []

  if (hero !== 'BB') {
    scenarios.push('RFI')
  }

  if (villain) {
    const villainBefore = villainIdx < heroIdx
    const villainAfter = villainIdx > heroIdx

    if (villainBefore) {
      scenarios.push('vs-open')
    }

    if (villainAfter) {
      scenarios.push('vs-3bet')
    }

    if (hero === 'BB' && villainBefore) {
      scenarios.push('vs-4bet')
    }
  }

  return scenarios
}

// Charts page component
function ChartsPage() {
  const { provider, position, villain } = useChartStore()
  const availableScenarios = getAvailableScenarios(position, villain)

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-4">
        <ProviderSelector />
        <ChartControls />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {availableScenarios.map(scenarioId => {
          const config = SCENARIOS.find(s => s.id === scenarioId)
          const scenarioVillain = config?.requiresVillain ? villain : undefined
          return (
            <HandGrid
              key={scenarioId}
              getCell={(hand: string) =>
                getCellWithCascadedWeight(provider, position, scenarioId, hand, scenarioVillain || undefined)
              }
              compact
              title={config?.label}
              subtitle={config?.description}
            />
          )
        })}
      </div>

      <Legend />
    </div>
  )
}

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ChartsPage,
})

const disclaimerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/disclaimer',
  component: DisclaimerPage,
})

const trainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/train',
  component: TrainerPage,
})

const analyzeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analyze',
  component: AnalyzerPage,
})

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: ReviewPage,
})

const postflopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/train/postflop',
  component: PostflopTrainerPage,
})

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play',
  component: HandFlowPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  trainRoute,
  postflopRoute,
  reviewRoute,
  analyzeRoute,
  settingsRoute,
  disclaimerRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
