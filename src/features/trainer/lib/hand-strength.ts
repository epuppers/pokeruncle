/**
 * Preflop hand strength rankings.
 *
 * Based on equity-vs-random-hand rankings — a well-established mathematical
 * ordering that is universally agreed upon in poker theory. This is NOT
 * invented range data; it is the mathematical ranking of how each starting
 * hand performs against a random hand dealt to an opponent.
 *
 * Rank 1 = strongest (AA), rank 169 = weakest (72o).
 */

/** The 169 canonical preflop hands ranked by equity vs a random hand */
const HAND_RANKINGS: readonly string[] = [
  // 1–10: Premium
  'AA', 'KK', 'QQ', 'JJ', 'AKs', 'TT', 'AQs', 'AKo', 'AJs', 'KQs',
  // 11–20
  '99', 'ATs', 'AQo', 'KJs', 'QJs', '88', 'KTs', 'A9s', 'AJo', 'JTs',
  // 21–30
  'QTs', 'KQo', '77', 'A8s', 'K9s', 'ATo', 'Q9s', 'J9s', 'T9s', 'A7s',
  // 31–40
  'KJo', '66', 'A5s', 'A6s', 'A4s', 'QJo', 'K8s', 'A3s', 'T8s', 'J8s',
  // 41–50
  '98s', 'A2s', 'KTo', '55', 'Q8s', 'K7s', 'JTo', '87s', 'QTo', 'K6s',
  // 51–60
  '97s', '44', 'K5s', '76s', 'T7s', 'K4s', 'J7s', 'Q7s', 'K3s', '86s',
  // 61–70
  '33', 'K2s', '65s', 'Q6s', 'J9o', 'A9o', '96s', '54s', 'T9o', 'Q5s',
  // 71–80
  '75s', '22', 'T6s', 'Q4s', 'J6s', 'Q3s', '85s', '98o', 'J8o', 'Q2s',
  // 81–90
  '64s', 'A8o', 'J5s', '87o', 'K9o', '53s', 'T8o', 'J4s', '95s', 'A7o',
  // 91–100
  '74s', 'J3s', 'A5o', 'T5s', 'J2s', '43s', 'A6o', 'Q9o', '76o', 'A4o',
  // 101–110
  '84s', '63s', '97o', 'T4s', 'A3o', '52s', '65o', 'T3s', 'K8o', '86o',
  // 111–120
  '94s', 'A2o', 'T2s', '73s', '54o', 'Q8o', '42s', 'T7o', 'K7o', '93s',
  // 121–130
  '83s', '75o', 'J7o', '96o', 'K6o', '32s', '85o', 'Q7o', '92s', '62s',
  // 131–140
  'K5o', '64o', 'Q6o', '82s', 'K4o', '53o', 'J6o', '95o', '72s', 'K3o',
  // 141–150
  '43o', 'Q5o', '74o', 'T6o', 'K2o', 'J5o', 'Q4o', '84o', '63o', 'Q3o',
  // 151–160
  '52o', 'J4o', 'Q2o', '42o', 'J3o', '94o', '73o', 'T5o', 'J2o', '32o',
  // 161–169
  '93o', 'T4o', '83o', 'T3o', '62o', '92o', 'T2o', '82o', '72o',
] as const

const TOTAL_HANDS = HAND_RANKINGS.length // 169

/** Build a map for O(1) lookup */
const rankMap = new Map<string, number>()
for (let i = 0; i < HAND_RANKINGS.length; i++) {
  rankMap.set(HAND_RANKINGS[i], i + 1) // 1-indexed
}

export type HandTier = 'premium' | 'strong' | 'playable' | 'marginal' | 'weak'

/**
 * Get the rank of a hand (1 = strongest, 169 = weakest).
 * Returns undefined if the hand name is not recognized.
 */
export function getHandRank(hand: string): number | undefined {
  return rankMap.get(hand)
}

/**
 * Get the percentile of a hand (1 = top 1%, 100 = worst).
 * Lower is stronger.
 */
export function getHandPercentile(hand: string): number {
  const rank = rankMap.get(hand)
  if (rank === undefined) return 50 // fallback for unrecognized hands
  return Math.ceil((rank / TOTAL_HANDS) * 100)
}

/** Categorize hand into a strength tier */
export function getHandTier(hand: string): HandTier {
  const pct = getHandPercentile(hand)
  if (pct <= 5) return 'premium'
  if (pct <= 15) return 'strong'
  if (pct <= 35) return 'playable'
  if (pct <= 60) return 'marginal'
  return 'weak'
}

/** Human-readable description of hand strength */
export function describeHandStrength(hand: string): string {
  const pct = getHandPercentile(hand)
  const tier = getHandTier(hand)

  const tierDesc: Record<HandTier, string> = {
    premium: 'a premium hand',
    strong: 'a strong hand',
    playable: 'a playable hand',
    marginal: 'a marginal hand',
    weak: 'a weak hand',
  }

  return `${tierDesc[tier]} (top ${pct}% of all starting hands)`
}

/** Get a friendly name for a hand (e.g., "Ace-King suited") */
export function getHandFriendlyName(hand: string): string {
  if (hand.length < 2) return hand

  const rankNames: Record<string, string> = {
    A: 'Ace',
    K: 'King',
    Q: 'Queen',
    J: 'Jack',
    T: 'Ten',
    '9': 'Nine',
    '8': 'Eight',
    '7': 'Seven',
    '6': 'Six',
    '5': 'Five',
    '4': 'Four',
    '3': 'Three',
    '2': 'Two',
  }

  const r1 = rankNames[hand[0]] ?? hand[0]
  const r2 = rankNames[hand[1]] ?? hand[1]

  // Pairs: "pair of Aces"
  if (hand[0] === hand[1]) return `pair of ${r1}s`

  const suffix = hand.endsWith('s') ? ' suited' : hand.endsWith('o') ? ' offsuit' : ''
  return `${r1}-${r2}${suffix}`
}
