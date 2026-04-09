export { TrainerPage } from './components/TrainerPage'
export { useRangeQuery } from './hooks/use-range-query'
export { loadProvider, resolveCorrectAction } from './lib/range-loader'
export { generateSmartSpot, generateSpot, generatePushFoldSpot, generateSmartPushFoldSpot } from './lib/spot-generator'
export { hasMixedStrategies, parseChartKey, parseTournamentChartKey, enumerateCharts, enumerateTournamentCharts } from './lib/chart-utils'
export { buildSpotTypeKey, buildSpotTypeKeyFromSpot, buildTournamentSpotTypeKey } from './lib/spot-type-key'
export { evToQualityScore, estimateEvLoss, updateMastery, createInitialMastery } from './lib/sm2'
export { recordSpotResult, getMasteryRecordsForProvider, getMasteryRecord } from './lib/mastery-persistence'
export type {
  Spot,
  SpotResult,
  TrainerPhase,
  SessionStats,
  SpotFilters,
  TrainerMode,
  ProviderCharts,
  StackDepth,
  TournamentScenario,
  ParsedTournamentChartKey,
} from './types'
