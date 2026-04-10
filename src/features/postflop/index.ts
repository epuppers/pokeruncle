// Public API for the postflop feature

// Types
export type {
  BoardTextureMask,
  CachedSolution,
  PostflopAction,
  PostflopActionWeights,
  PostflopBoard,
  PostflopSessionStats,
  PostflopSpot,
  PostflopSpotResult,
  PostflopStreet,
  PostflopTrainerPhase,
} from './types'

export {
  BET_SIZING_PCT,
  POSTFLOP_ACTION_LABELS,
  POSTFLOP_ACTIONS,
  POSTFLOP_STREETS,
  TEXTURE_CONNECTED,
  TEXTURE_FLUSH_DRAW,
  TEXTURE_HIGH,
  TEXTURE_LOW,
  TEXTURE_MONOTONE,
  TEXTURE_PAIRED,
  TEXTURE_RAINBOW,
  TEXTURE_STRAIGHT_POSSIBLE,
  TEXTURE_TRIPS,
  TEXTURE_TWO_TONE,
} from './types'

// Board texture classifier
export {
  classifyBoard,
  describeTexture,
  hasFlushDraw,
  hasTexture,
  hasTrips,
  isConnected,
  isHigh,
  isLow,
  isMonotone,
  isPaired,
  isRainbow,
  isStraightPossible,
  isTwoTone,
} from './lib/board-texture'

// Solution cache
export {
  clearCaches,
  getAvailableSolutions,
  getSolution,
  loadManifest,
} from './lib/solution-cache'

// Solution schema
export type { SolutionManifest, SolutionManifestEntry } from './lib/solution-schema'

// Spot generator
export {
  generatePostflopSpot,
  parseBoardString,
  pickRandomEntry,
  resolvePostflopAction,
} from './lib/spot-generator'

// Feedback engine
export { generatePostflopFeedback } from './lib/feedback-engine'
export type { PostflopFeedbackContent } from './lib/feedback-engine'

// Persistence
export { recordPostflopSpotResult } from './lib/postflop-persistence'

// Page component (for lazy loading in router)
export { PostflopTrainerPage } from './components/PostflopTrainerPage'
