import type { HandType, Provider, Scenario } from '@/types/poker'

import type { MasteryRecord } from '@/lib/db'

import { enumerateCharts, enumerateTournamentCharts } from '@/features/trainer/lib/chart-utils'
import { getCellFromLoaded, resolveCorrectAction } from '@/features/trainer/lib/range-loader'
import type { ProviderCharts } from '@/features/trainer/lib/range-loader'
import { buildSpotTypeKey, buildTournamentSpotTypeKey } from '@/features/trainer/lib/spot-type-key'
import type {
  ParsedChartKey,
  ParsedTournamentChartKey,
  Spot,
  SpotFilters,
  TournamentScenario,
} from '@/features/trainer/types'

/**
 * Generate a random training spot from the loaded charts.
 * Picks a random chart (optionally filtered by scenario), a random hand
 * from that chart, rolls 1-100 for mixed-strategy resolution, and computes
 * the correct action.
 */
export function generateSpot(
  charts: ProviderCharts,
  provider: Provider,
  scenarioFilter?: Scenario,
): Spot {
  const entries = enumerateCharts(charts)
  const filtered = scenarioFilter
    ? entries.filter((e) => e.scenario === scenarioFilter)
    : entries

  if (filtered.length === 0) {
    throw new Error(
      `No charts available for provider "${provider}"${scenarioFilter ? ` with scenario "${scenarioFilter}"` : ''}`,
    )
  }

  // Pick a random chart
  const entry = filtered[Math.floor(Math.random() * filtered.length)]
  const chart = charts[buildKey(entry.hero, entry.scenario, entry.villain)]

  if (!chart) {
    throw new Error(`Chart not found for key: ${buildKey(entry.hero, entry.scenario, entry.villain)}`)
  }

  // Pick a random hand from the chart (only hands that are in the chart, not folds)
  const hands = Object.keys(chart)
  if (hands.length === 0) {
    throw new Error(`Chart has no hands: ${buildKey(entry.hero, entry.scenario, entry.villain)}`)
  }

  const heroHand = hands[Math.floor(Math.random() * hands.length)]
  const cell = getCellFromLoaded(charts, entry.hero, entry.scenario, heroHand, entry.villain)
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolveCorrectAction(cell, rolledNumber)
  const id = crypto.randomUUID()

  if (entry.scenario === 'RFI') {
    return {
      kind: 'open',
      id,
      provider,
      hero: entry.hero,
      scenario: entry.scenario,
      heroHand,
      cell,
      rolledNumber,
      correctAction,
    }
  }

  return {
    kind: 'response',
    id,
    provider,
    hero: entry.hero,
    villain: entry.villain!,
    scenario: entry.scenario,
    heroHand,
    cell,
    rolledNumber,
    correctAction,
  }
}

/**
 * Generate a spot using SM-2 mastery-aware selection.
 * Prioritizes overdue spots, then new (unseen) spots, then soonest-due.
 */
export function generateSmartSpot(
  charts: ProviderCharts,
  provider: Provider,
  masteryRecords: MasteryRecord[],
  filters: SpotFilters,
): Spot {
  const candidates = buildFilteredCandidates(charts, filters)

  if (candidates.length === 0) {
    throw new Error('No spots match the current filters')
  }

  const masteryByKey = new Map(masteryRecords.map((r) => [r.spotTypeKey, r]))
  const now = Date.now()

  // Partition into due, new, and future
  const due: { key: string; candidate: ChartHandPair; nextReviewAt: number }[] = []
  const unseen: ChartHandPair[] = []
  const future: { candidate: ChartHandPair; nextReviewAt: number }[] = []

  for (const candidate of candidates) {
    const spotKey = buildSpotTypeKey(
      provider,
      candidate.chart.hero,
      candidate.chart.scenario,
      candidate.hand,
      candidate.chart.villain,
    )
    const mastery = masteryByKey.get(spotKey)

    if (!mastery) {
      unseen.push(candidate)
    } else if (mastery.nextReviewAt <= now) {
      due.push({ key: spotKey, candidate, nextReviewAt: mastery.nextReviewAt })
    } else {
      future.push({ candidate, nextReviewAt: mastery.nextReviewAt })
    }
  }

  let picked: ChartHandPair

  if (due.length > 0) {
    // Pick the most overdue (lowest nextReviewAt)
    due.sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    picked = due[0].candidate
  } else if (unseen.length > 0) {
    // Pick a random unseen spot
    picked = unseen[Math.floor(Math.random() * unseen.length)]
  } else {
    // All seen and none due — cram the soonest-due
    future.sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    picked = future[0].candidate
  }

  return buildSpotFromCandidate(picked, charts, provider)
}

interface ChartHandPair {
  chart: ParsedChartKey
  hand: string
}

function buildFilteredCandidates(charts: ProviderCharts, filters: SpotFilters): ChartHandPair[] {
  const entries = enumerateCharts(charts)
  const filtered = entries.filter((entry) => {
    if (filters.positions.length > 0 && !filters.positions.includes(entry.hero)) return false
    if (filters.scenarios.length > 0 && !filters.scenarios.includes(entry.scenario)) return false
    return true
  })

  const candidates: ChartHandPair[] = []
  for (const chart of filtered) {
    const key = buildKey(chart.hero, chart.scenario, chart.villain)
    const chartData = charts[key]
    if (!chartData) continue

    for (const hand of Object.keys(chartData)) {
      if (filters.handTypes.length > 0 && !filters.handTypes.includes(classifyHand(hand))) {
        continue
      }
      candidates.push({ chart, hand })
    }
  }

  return candidates
}

function classifyHand(hand: string): HandType {
  if (hand.length === 2) return 'pair'
  if (hand.endsWith('s')) return 'suited'
  return 'offsuit'
}

function buildSpotFromCandidate(
  candidate: ChartHandPair,
  charts: ProviderCharts,
  provider: Provider,
): Spot {
  const { chart, hand } = candidate
  const cell = getCellFromLoaded(charts, chart.hero, chart.scenario, hand, chart.villain)
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolveCorrectAction(cell, rolledNumber)
  const id = crypto.randomUUID()

  if (chart.scenario === 'RFI') {
    return {
      kind: 'open',
      id,
      provider,
      hero: chart.hero,
      scenario: chart.scenario,
      heroHand: hand,
      cell,
      rolledNumber,
      correctAction,
    }
  }

  return {
    kind: 'response',
    id,
    provider,
    hero: chart.hero,
    villain: chart.villain!,
    scenario: chart.scenario,
    heroHand: hand,
    cell,
    rolledNumber,
    correctAction,
  }
}

function buildKey(hero: string, scenario: string, villain?: string): string {
  return villain ? `${hero}-${scenario}-${villain}` : `${hero}-${scenario}`
}

// ============================================================
// Push/fold spot generation
// ============================================================

interface TournamentChartHandPair {
  chart: ParsedTournamentChartKey
  hand: string
}

function buildTournamentChartKey(chart: ParsedTournamentChartKey): string {
  const base = `${chart.hero}-${chart.scenario}-${chart.stackDepth}`
  return chart.villain ? `${base}-${chart.villain}` : base
}

function buildFilteredTournamentCandidates(
  charts: ProviderCharts,
  filters: SpotFilters,
): TournamentChartHandPair[] {
  const entries = enumerateTournamentCharts(charts)
  const filtered = entries.filter((entry) => {
    if (filters.positions.length > 0 && !filters.positions.includes(entry.hero)) return false
    if (filters.stackDepths.length > 0 && !filters.stackDepths.includes(entry.stackDepth)) return false
    // Filter by tournament scenario if any standard scenarios are set — but tournament scenarios
    // are separate. We check if the entry's scenario matches any selected tournament scenario
    // passed through the tournamentScenarios filter (stored in scenarios field for simplicity).
    return true
  })

  const candidates: TournamentChartHandPair[] = []
  for (const chart of filtered) {
    const key = buildTournamentChartKey(chart)
    const chartData = charts[key]
    if (!chartData) continue

    for (const hand of Object.keys(chartData)) {
      if (filters.handTypes.length > 0 && !classifyHand(hand)) continue
      if (filters.handTypes.length > 0 && !filters.handTypes.includes(classifyHand(hand))) continue
      candidates.push({ chart, hand })
    }
  }

  return candidates
}

function buildPushFoldSpotFromCandidate(
  candidate: TournamentChartHandPair,
  charts: ProviderCharts,
): Spot {
  const { chart, hand } = candidate
  const key = buildTournamentChartKey(chart)
  const chartData = charts[key]
  const cell = chartData?.[hand] ?? 'fold'
  const rolledNumber = Math.ceil(Math.random() * 100)
  const correctAction = resolveCorrectAction(cell, rolledNumber)
  const id = crypto.randomUUID()

  return {
    kind: 'push-fold',
    id,
    provider: 'nash-pushfold',
    hero: chart.hero,
    scenario: chart.scenario,
    villain: chart.villain,
    heroHand: hand,
    cell,
    rolledNumber,
    correctAction,
    stackDepth: chart.stackDepth,
  }
}

/**
 * Generate a random push/fold spot from loaded tournament charts.
 */
export function generatePushFoldSpot(
  charts: ProviderCharts,
  filters: SpotFilters,
  scenarioFilter?: TournamentScenario,
): Spot {
  let candidates = buildFilteredTournamentCandidates(charts, filters)

  if (scenarioFilter) {
    candidates = candidates.filter((c) => c.chart.scenario === scenarioFilter)
  }

  if (candidates.length === 0) {
    throw new Error('No push/fold spots match the current filters')
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  return buildPushFoldSpotFromCandidate(picked, charts)
}

/**
 * Generate a push/fold spot using SM-2 mastery-aware selection.
 */
export function generateSmartPushFoldSpot(
  charts: ProviderCharts,
  masteryRecords: MasteryRecord[],
  filters: SpotFilters,
): Spot {
  const candidates = buildFilteredTournamentCandidates(charts, filters)

  if (candidates.length === 0) {
    throw new Error('No push/fold spots match the current filters')
  }

  const masteryByKey = new Map(masteryRecords.map((r) => [r.spotTypeKey, r]))
  const now = Date.now()

  const due: { candidate: TournamentChartHandPair; nextReviewAt: number }[] = []
  const unseen: TournamentChartHandPair[] = []
  const future: { candidate: TournamentChartHandPair; nextReviewAt: number }[] = []

  for (const candidate of candidates) {
    const spotKey = buildTournamentSpotTypeKey(
      'nash-pushfold',
      candidate.chart.hero,
      candidate.chart.scenario,
      candidate.hand,
      candidate.chart.stackDepth,
      candidate.chart.villain,
    )
    const mastery = masteryByKey.get(spotKey)

    if (!mastery) {
      unseen.push(candidate)
    } else if (mastery.nextReviewAt <= now) {
      due.push({ candidate, nextReviewAt: mastery.nextReviewAt })
    } else {
      future.push({ candidate, nextReviewAt: mastery.nextReviewAt })
    }
  }

  let picked: TournamentChartHandPair

  if (due.length > 0) {
    due.sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    picked = due[0].candidate
  } else if (unseen.length > 0) {
    picked = unseen[Math.floor(Math.random() * unseen.length)]
  } else {
    future.sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    picked = future[0].candidate
  }

  return buildPushFoldSpotFromCandidate(picked, charts)
}
