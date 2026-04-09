/**
 * Nash push/fold equilibrium charts for tournament play.
 *
 * Ranges are approximations of standard Nash equilibrium push/fold tables,
 * adapted for 6-max play at various effective stack depths. Sources include
 * Sklansky-Chubukov rankings, standard ICMizer reference charts, and widely
 * published tournament strategy guides.
 *
 * Chart key format:
 *   {position}-push-{depth}          — push (shove) range
 *   {position}-vs-push-{depth}-{villain} — calling range vs a push
 *
 * All push chart hands map to 'allin'. All calling chart hands map to 'call'.
 * Unlisted hands are folds (upstream convention).
 */

import type { Chart } from './index'
import { pushChart, callChart } from './range-notation'

// ============================================================
// PUSH (SHOVE) RANGES
// ============================================================

// --- 5bb ---
// At 5bb, ranges are very wide. Even UTG pushes ~25% of hands.

const UTG_push_5: Chart = pushChart(
  '22+, A2s+, K8s+, Q9s+, J9s+, T9s, A2o+, KTo+, QTo+, JTo',
)

const MP_push_5: Chart = pushChart(
  '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 98s, A2o+, K8o+, Q9o+, JTo',
)

const CO_push_5: Chart = pushChart(
  '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 87s, 76s, A2o+, K5o+, Q8o+, J9o+, T9o',
)

const BTN_push_5: Chart = pushChart(
  '22+, A2s+, K2s+, Q2s+, J5s+, T6s+, 96s+, 86s+, 76s, 65s, 54s, A2o+, K3o+, Q7o+, J8o+, T8o+, 98o',
)

const SB_push_5: Chart = pushChart(
  '22+, A2s+, K2s+, Q2s+, J2s+, T3s+, 95s+, 85s+, 75s+, 64s+, 54s, 43s, A2o+, K2o+, Q3o+, J7o+, T7o+, 97o+, 87o',
)

// --- 8bb ---

const UTG_push_8: Chart = pushChart(
  '33+, A5s+, K9s+, QTs+, JTs, A7o+, KTo+, QJo',
)

const MP_push_8: Chart = pushChart(
  '22+, A3s+, K7s+, Q9s+, J9s+, T9s, A5o+, K9o+, QTo+, JTo',
)

const CO_push_8: Chart = pushChart(
  '22+, A2s+, K4s+, Q7s+, J8s+, T8s+, 98s, 87s, A2o+, K7o+, Q9o+, JTo',
)

const BTN_push_8: Chart = pushChart(
  '22+, A2s+, K2s+, Q3s+, J6s+, T6s+, 96s+, 86s+, 76s, 65s, A2o+, K4o+, Q8o+, J9o+, T9o',
)

const SB_push_8: Chart = pushChart(
  '22+, A2s+, K2s+, Q2s+, J3s+, T5s+, 95s+, 85s+, 75s+, 65s, 54s, A2o+, K2o+, Q4o+, J8o+, T8o+, 98o',
)

// --- 10bb ---

const UTG_push_10: Chart = pushChart(
  '44+, A8s+, KTs+, QJs, ATo+, KJo+',
)

const MP_push_10: Chart = pushChart(
  '33+, A6s+, K9s+, QTs+, JTs, A9o+, KTo+, QJo',
)

const CO_push_10: Chart = pushChart(
  '22+, A2s+, K7s+, Q9s+, J9s+, T9s, A5o+, K9o+, QTo+, JTo',
)

const BTN_push_10: Chart = pushChart(
  '22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 87s, 76s, A2o+, K6o+, Q9o+, JTo',
)

const SB_push_10: Chart = pushChart(
  '22+, A2s+, K2s+, Q2s+, J4s+, T6s+, 96s+, 86s+, 76s, 65s, A2o+, K3o+, Q7o+, J9o+, T9o',
)

// --- 13bb ---

const UTG_push_13: Chart = pushChart(
  '55+, A9s+, KTs+, QJs, ATo+, KJo+',
)

const MP_push_13: Chart = pushChart(
  '44+, A7s+, K9s+, QTs+, JTs, A9o+, KTo+, QJo',
)

const CO_push_13: Chart = pushChart(
  '22+, A3s+, K8s+, Q9s+, J9s+, T9s, A7o+, K9o+, QTo+, JTo',
)

const BTN_push_13: Chart = pushChart(
  '22+, A2s+, K3s+, Q7s+, J8s+, T8s+, 97s+, 87s, A2o+, K7o+, Q9o+, JTo',
)

const SB_push_13: Chart = pushChart(
  '22+, A2s+, K2s+, Q3s+, J5s+, T6s+, 96s+, 86s+, 76s, 65s, A2o+, K4o+, Q8o+, J9o+, T9o',
)

// --- 15bb ---

const UTG_push_15: Chart = pushChart(
  '66+, ATs+, KJs+, AJo+, KQo',
)

const MP_push_15: Chart = pushChart(
  '55+, A8s+, KTs+, QJs, ATo+, KJo+',
)

const CO_push_15: Chart = pushChart(
  '33+, A5s+, K9s+, QTs+, JTs, A8o+, KTo+, QJo',
)

const BTN_push_15: Chart = pushChart(
  '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 98s, 87s, A3o+, K8o+, QTo+, JTo',
)

const SB_push_15: Chart = pushChart(
  '22+, A2s+, K2s+, Q4s+, J7s+, T7s+, 97s+, 87s, 76s, A2o+, K5o+, Q9o+, J9o+, T9o',
)

// --- 20bb ---

const UTG_push_20: Chart = pushChart(
  '88+, AJs+, KQs, AQo+',
)

const MP_push_20: Chart = pushChart(
  '66+, ATs+, KJs+, AJo+, KQo',
)

const CO_push_20: Chart = pushChart(
  '44+, A7s+, KTs+, QJs, A9o+, KJo+',
)

const BTN_push_20: Chart = pushChart(
  '22+, A2s+, K7s+, Q9s+, J9s+, T9s, A5o+, K9o+, QTo+, JTo',
)

const SB_push_20: Chart = pushChart(
  '22+, A2s+, K3s+, Q7s+, J8s+, T8s+, 98s, 87s, A2o+, K7o+, Q9o+, JTo',
)

// --- 25bb ---

const UTG_push_25: Chart = pushChart(
  'TT+, AQs+, AKo',
)

const MP_push_25: Chart = pushChart(
  '88+, AJs+, KQs, AQo+',
)

const CO_push_25: Chart = pushChart(
  '55+, A9s+, KTs+, QJs, ATo+, KQo',
)

const BTN_push_25: Chart = pushChart(
  '33+, A4s+, K8s+, QTs+, JTs, A7o+, KTo+, QJo',
)

const SB_push_25: Chart = pushChart(
  '22+, A2s+, K5s+, Q8s+, J9s+, T9s, 98s, A3o+, K8o+, QTo+, JTo',
)

// ============================================================
// CALLING RANGES (vs push)
// ============================================================
// Calling ranges are tighter than pushing ranges because the
// caller must actually show down. The closer the caller is to
// the pusher, the wider the calling range (pot odds improve).

// --- 5bb ---

const BB_vs_push_5_SB: Chart = callChart(
  '22+, A2s+, K3s+, Q7s+, J8s+, T8s+, 98s, A2o+, K6o+, Q9o+, JTo',
)

const BB_vs_push_5_BTN: Chart = callChart(
  '22+, A2s+, K7s+, Q9s+, J9s+, T9s, A3o+, K9o+, QTo+, JTo',
)

const BB_vs_push_5_CO: Chart = callChart(
  '33+, A2s+, K9s+, QTs+, JTs, A5o+, KTo+, QJo',
)

const BB_vs_push_5_MP: Chart = callChart(
  '44+, A5s+, KTs+, QJs, A8o+, KJo+',
)

const BB_vs_push_5_UTG: Chart = callChart(
  '55+, A8s+, KTs+, ATo+, KJo+',
)

const SB_vs_push_5_BTN: Chart = callChart(
  '33+, A2s+, K8s+, QTs+, JTs, A5o+, KTo+, QJo',
)

const SB_vs_push_5_CO: Chart = callChart(
  '44+, A4s+, K9s+, QTs+, A8o+, KTo+',
)

// --- 8bb ---

const BB_vs_push_8_SB: Chart = callChart(
  '22+, A2s+, K5s+, Q8s+, J9s+, T9s, A2o+, K8o+, QTo+, JTo',
)

const BB_vs_push_8_BTN: Chart = callChart(
  '33+, A2s+, K8s+, QTs+, JTs, A5o+, KTo+, QJo',
)

const BB_vs_push_8_CO: Chart = callChart(
  '44+, A5s+, KTs+, QJs, A8o+, KJo+',
)

const BB_vs_push_8_MP: Chart = callChart(
  '66+, A8s+, KTs+, ATo+, KJo+',
)

const BB_vs_push_8_UTG: Chart = callChart(
  '77+, ATs+, KJs+, AJo+',
)

const SB_vs_push_8_BTN: Chart = callChart(
  '44+, A3s+, K9s+, QTs+, A7o+, KTo+, QJo',
)

const SB_vs_push_8_CO: Chart = callChart(
  '55+, A7s+, KTs+, QJs, ATo+, KJo+',
)

// --- 10bb ---

const BB_vs_push_10_SB: Chart = callChart(
  '22+, A2s+, K7s+, Q9s+, JTs, A3o+, K9o+, QTo+, JTo',
)

const BB_vs_push_10_BTN: Chart = callChart(
  '44+, A2s+, K9s+, QTs+, JTs, A7o+, KTo+, QJo',
)

const BB_vs_push_10_CO: Chart = callChart(
  '55+, A7s+, KTs+, QJs, ATo+, KJo+',
)

const BB_vs_push_10_MP: Chart = callChart(
  '77+, A9s+, KJs+, AJo+, KQo',
)

const BB_vs_push_10_UTG: Chart = callChart(
  '88+, ATs+, KQs, AQo+',
)

const SB_vs_push_10_BTN: Chart = callChart(
  '55+, A5s+, KTs+, QJs, A9o+, KJo+',
)

const SB_vs_push_10_CO: Chart = callChart(
  '66+, A8s+, KJs+, ATo+, KQo',
)

// --- 13bb ---

const BB_vs_push_13_SB: Chart = callChart(
  '33+, A2s+, K8s+, QTs+, JTs, A5o+, KTo+, QJo',
)

const BB_vs_push_13_BTN: Chart = callChart(
  '55+, A4s+, KTs+, QJs, A8o+, KJo+',
)

const BB_vs_push_13_CO: Chart = callChart(
  '66+, A8s+, KJs+, ATo+, KQo',
)

const BB_vs_push_13_MP: Chart = callChart(
  '88+, ATs+, KQs, AQo+',
)

const BB_vs_push_13_UTG: Chart = callChart(
  '99+, AJs+, AQo+',
)

const SB_vs_push_13_BTN: Chart = callChart(
  '66+, A7s+, KTs+, QJs, ATo+, KJo+',
)

const SB_vs_push_13_CO: Chart = callChart(
  '77+, A9s+, KJs+, AJo+, KQo',
)

// --- 15bb ---

const BB_vs_push_15_SB: Chart = callChart(
  '33+, A3s+, K9s+, QTs+, JTs, A7o+, KTo+, QJo',
)

const BB_vs_push_15_BTN: Chart = callChart(
  '55+, A5s+, KTs+, QJs, A9o+, KJo+',
)

const BB_vs_push_15_CO: Chart = callChart(
  '77+, A9s+, KJs+, AJo+, KQo',
)

const BB_vs_push_15_MP: Chart = callChart(
  '88+, ATs+, KQs, AQo+',
)

const BB_vs_push_15_UTG: Chart = callChart(
  'TT+, AJs+, AQo+',
)

const SB_vs_push_15_BTN: Chart = callChart(
  '66+, A8s+, KTs+, QJs, ATo+, KQo',
)

const SB_vs_push_15_CO: Chart = callChart(
  '88+, ATs+, KQs, AJo+',
)

// --- 20bb ---

const BB_vs_push_20_SB: Chart = callChart(
  '44+, A4s+, KTs+, QJs, A8o+, KJo+',
)

const BB_vs_push_20_BTN: Chart = callChart(
  '66+, A7s+, KJs+, ATo+, KQo',
)

const BB_vs_push_20_CO: Chart = callChart(
  '88+, ATs+, KQs, AJo+',
)

const BB_vs_push_20_MP: Chart = callChart(
  '99+, AJs+, AQo+',
)

const BB_vs_push_20_UTG: Chart = callChart(
  'TT+, AQs+, AKo',
)

const SB_vs_push_20_BTN: Chart = callChart(
  '77+, A9s+, KJs+, AJo+, KQo',
)

const SB_vs_push_20_CO: Chart = callChart(
  '88+, ATs+, KQs, AQo+',
)

// --- 25bb ---

const BB_vs_push_25_SB: Chart = callChart(
  '55+, A5s+, KTs+, QJs, A9o+, KJo+',
)

const BB_vs_push_25_BTN: Chart = callChart(
  '77+, A8s+, KJs+, ATo+, KQo',
)

const BB_vs_push_25_CO: Chart = callChart(
  '88+, ATs+, KQs, AQo+',
)

const BB_vs_push_25_MP: Chart = callChart(
  'TT+, AQs+, AKo',
)

const BB_vs_push_25_UTG: Chart = callChart(
  'JJ+, AKs',
)

const SB_vs_push_25_BTN: Chart = callChart(
  '77+, ATs+, KJs+, AJo+, KQo',
)

const SB_vs_push_25_CO: Chart = callChart(
  '99+, AJs+, AQo+',
)

// ============================================================
// EXPORTED CHART MAP
// ============================================================

export const charts: Record<string, Chart> = {
  // Push ranges — 5bb
  'UTG-push-5': UTG_push_5,
  'MP-push-5': MP_push_5,
  'CO-push-5': CO_push_5,
  'BTN-push-5': BTN_push_5,
  'SB-push-5': SB_push_5,

  // Push ranges — 8bb
  'UTG-push-8': UTG_push_8,
  'MP-push-8': MP_push_8,
  'CO-push-8': CO_push_8,
  'BTN-push-8': BTN_push_8,
  'SB-push-8': SB_push_8,

  // Push ranges — 10bb
  'UTG-push-10': UTG_push_10,
  'MP-push-10': MP_push_10,
  'CO-push-10': CO_push_10,
  'BTN-push-10': BTN_push_10,
  'SB-push-10': SB_push_10,

  // Push ranges — 13bb
  'UTG-push-13': UTG_push_13,
  'MP-push-13': MP_push_13,
  'CO-push-13': CO_push_13,
  'BTN-push-13': BTN_push_13,
  'SB-push-13': SB_push_13,

  // Push ranges — 15bb
  'UTG-push-15': UTG_push_15,
  'MP-push-15': MP_push_15,
  'CO-push-15': CO_push_15,
  'BTN-push-15': BTN_push_15,
  'SB-push-15': SB_push_15,

  // Push ranges — 20bb
  'UTG-push-20': UTG_push_20,
  'MP-push-20': MP_push_20,
  'CO-push-20': CO_push_20,
  'BTN-push-20': BTN_push_20,
  'SB-push-20': SB_push_20,

  // Push ranges — 25bb
  'UTG-push-25': UTG_push_25,
  'MP-push-25': MP_push_25,
  'CO-push-25': CO_push_25,
  'BTN-push-25': BTN_push_25,
  'SB-push-25': SB_push_25,

  // Calling ranges — 5bb
  'BB-vs-push-5-SB': BB_vs_push_5_SB,
  'BB-vs-push-5-BTN': BB_vs_push_5_BTN,
  'BB-vs-push-5-CO': BB_vs_push_5_CO,
  'BB-vs-push-5-MP': BB_vs_push_5_MP,
  'BB-vs-push-5-UTG': BB_vs_push_5_UTG,
  'SB-vs-push-5-BTN': SB_vs_push_5_BTN,
  'SB-vs-push-5-CO': SB_vs_push_5_CO,

  // Calling ranges — 8bb
  'BB-vs-push-8-SB': BB_vs_push_8_SB,
  'BB-vs-push-8-BTN': BB_vs_push_8_BTN,
  'BB-vs-push-8-CO': BB_vs_push_8_CO,
  'BB-vs-push-8-MP': BB_vs_push_8_MP,
  'BB-vs-push-8-UTG': BB_vs_push_8_UTG,
  'SB-vs-push-8-BTN': SB_vs_push_8_BTN,
  'SB-vs-push-8-CO': SB_vs_push_8_CO,

  // Calling ranges — 10bb
  'BB-vs-push-10-SB': BB_vs_push_10_SB,
  'BB-vs-push-10-BTN': BB_vs_push_10_BTN,
  'BB-vs-push-10-CO': BB_vs_push_10_CO,
  'BB-vs-push-10-MP': BB_vs_push_10_MP,
  'BB-vs-push-10-UTG': BB_vs_push_10_UTG,
  'SB-vs-push-10-BTN': SB_vs_push_10_BTN,
  'SB-vs-push-10-CO': SB_vs_push_10_CO,

  // Calling ranges — 13bb
  'BB-vs-push-13-SB': BB_vs_push_13_SB,
  'BB-vs-push-13-BTN': BB_vs_push_13_BTN,
  'BB-vs-push-13-CO': BB_vs_push_13_CO,
  'BB-vs-push-13-MP': BB_vs_push_13_MP,
  'BB-vs-push-13-UTG': BB_vs_push_13_UTG,
  'SB-vs-push-13-BTN': SB_vs_push_13_BTN,
  'SB-vs-push-13-CO': SB_vs_push_13_CO,

  // Calling ranges — 15bb
  'BB-vs-push-15-SB': BB_vs_push_15_SB,
  'BB-vs-push-15-BTN': BB_vs_push_15_BTN,
  'BB-vs-push-15-CO': BB_vs_push_15_CO,
  'BB-vs-push-15-MP': BB_vs_push_15_MP,
  'BB-vs-push-15-UTG': BB_vs_push_15_UTG,
  'SB-vs-push-15-BTN': SB_vs_push_15_BTN,
  'SB-vs-push-15-CO': SB_vs_push_15_CO,

  // Calling ranges — 20bb
  'BB-vs-push-20-SB': BB_vs_push_20_SB,
  'BB-vs-push-20-BTN': BB_vs_push_20_BTN,
  'BB-vs-push-20-CO': BB_vs_push_20_CO,
  'BB-vs-push-20-MP': BB_vs_push_20_MP,
  'BB-vs-push-20-UTG': BB_vs_push_20_UTG,
  'SB-vs-push-20-BTN': SB_vs_push_20_BTN,
  'SB-vs-push-20-CO': SB_vs_push_20_CO,

  // Calling ranges — 25bb
  'BB-vs-push-25-SB': BB_vs_push_25_SB,
  'BB-vs-push-25-BTN': BB_vs_push_25_BTN,
  'BB-vs-push-25-CO': BB_vs_push_25_CO,
  'BB-vs-push-25-MP': BB_vs_push_25_MP,
  'BB-vs-push-25-UTG': BB_vs_push_25_UTG,
  'SB-vs-push-25-BTN': SB_vs_push_25_BTN,
  'SB-vs-push-25-CO': SB_vs_push_25_CO,
}
