import { positionLabel } from '@/lib/poker-glossary'
import {
  describeHandStrength,
  getHandFriendlyName,
  getHandTier,
} from '@/features/trainer/lib/hand-strength'

import type { PostflopSpot, PostflopSpotResult } from '../types'
import { POSTFLOP_ACTION_LABELS } from '../types'
import { describeTexture, hasTexture } from './board-texture'
import {
  TEXTURE_CONNECTED,
  TEXTURE_FLUSH_DRAW,
  TEXTURE_HIGH,
  TEXTURE_LOW,
  TEXTURE_MONOTONE,
  TEXTURE_PAIRED,
  TEXTURE_STRAIGHT_POSSIBLE,
} from '../types'

export interface PostflopFeedbackContent {
  headline: string
  handContext: string
  boardContext: string
  positionContext: string
  reasoning: string
  tip: string
}

export function generatePostflopFeedback(
  spot: PostflopSpot,
  result: PostflopSpotResult,
): PostflopFeedbackContent {
  const headline = result.isCorrect ? 'Nice!' : 'Not quite.'
  const handContext = buildHandContext(spot)
  const boardContext = buildBoardContext(spot)
  const positionContext = buildPositionContext(spot)
  const reasoning = buildReasoning(spot, result)
  const tip = buildTip(spot)

  return { headline, handContext, boardContext, positionContext, reasoning, tip }
}

function buildHandContext(spot: PostflopSpot): string {
  const name = getHandFriendlyName(spot.heroHand)
  const strengthDesc = describeHandStrength(spot.heroHand)
  return `${capitalize(name)} is ${strengthDesc}.`
}

function buildBoardContext(spot: PostflopSpot): string {
  const texture = describeTexture(spot.boardTexture)
  const boardCards = spot.board.map((c) => `${c.rank}${c.suit}`).join(' ')
  const parts: string[] = [`The ${spot.street} is ${boardCards} — a ${texture.toLowerCase()} board.`]

  if (hasTexture(spot.boardTexture, TEXTURE_MONOTONE)) {
    parts.push('Monotone boards heavily favor the caller\'s range — they hold more suited combos.')
  } else if (hasTexture(spot.boardTexture, TEXTURE_FLUSH_DRAW)) {
    parts.push('Two cards of the same suit means flush draws are in play.')
  }

  if (hasTexture(spot.boardTexture, TEXTURE_CONNECTED) && hasTexture(spot.boardTexture, TEXTURE_STRAIGHT_POSSIBLE)) {
    parts.push('This connected texture creates many straight draws.')
  }

  if (hasTexture(spot.boardTexture, TEXTURE_PAIRED)) {
    parts.push('The paired board reduces the number of strong hands both players can have.')
  }

  if (hasTexture(spot.boardTexture, TEXTURE_HIGH)) {
    parts.push('High cards on board interact more with the opener\'s range.')
  } else if (hasTexture(spot.boardTexture, TEXTURE_LOW)) {
    parts.push('Low boards tend to miss the opener\'s range and favor the defender.')
  }

  return parts.join(' ')
}

function buildPositionContext(spot: PostflopSpot): string {
  const heroPos = positionLabel(spot.hero)
  const villainPos = positionLabel(spot.villain)

  if (spot.heroIsIP) {
    return `You're in position (${heroPos} vs ${villainPos}). Acting last gives you an information advantage — you see villain's action before deciding.`
  }
  return `You're out of position (${heroPos} vs ${villainPos}). Acting first is a disadvantage — the solver often checks more frequently OOP to avoid building a pot without information.`
}

function buildReasoning(spot: PostflopSpot, result: PostflopSpotResult): string {
  const correctLabel = POSTFLOP_ACTION_LABELS[spot.correctAction]
  const correctFreq = spot.correctStrategy[spot.correctAction] ?? 0
  const tier = getHandTier(spot.heroHand)

  if (result.isCorrect) {
    if (correctFreq >= 80) {
      return `${correctLabel} is the clear best play here — the solver does this ${correctFreq}% of the time.`
    }
    return `Good read. The solver plays ${correctLabel} ${correctFreq}% here, but this is a mixed spot — multiple actions have merit.`
  }

  // Wrong answer
  const userLabel = POSTFLOP_ACTION_LABELS[result.userAction]
  const userFreq = spot.correctStrategy[result.userAction] ?? 0

  if (userFreq > 0) {
    return `${userLabel} isn't wrong per se — the solver does it ${userFreq}% of the time. But ${correctLabel} at ${correctFreq}% is the highest-frequency play with your roll of ${spot.rolledNumber}.`
  }

  // User chose an action that has 0% frequency
  if (result.userAction === 'fold' && tier !== 'weak') {
    return `Folding here is too tight. With ${getHandFriendlyName(spot.heroHand)}, the solver never folds — ${correctLabel} is correct ${correctFreq}% of the time.`
  }

  if (result.userAction === 'allin' || result.userAction === 'bet-large') {
    return `That's too aggressive for this spot. The solver prefers ${correctLabel} (${correctFreq}%) — overbetting here turns your hand into a bluff unnecessarily.`
  }

  return `The solver plays ${correctLabel} ${correctFreq}% here. ${capitalize(userLabel)} has 0% frequency in this spot.`
}

function buildTip(spot: PostflopSpot): string {
  const tier = getHandTier(spot.heroHand)

  if (hasTexture(spot.boardTexture, TEXTURE_MONOTONE)) {
    return 'On monotone boards, bet sizing matters. Small bets protect your checking range; large bets polarize for value and bluffs.'
  }

  if (hasTexture(spot.boardTexture, TEXTURE_PAIRED)) {
    return 'Paired boards reduce hand combinations. Sets and full houses are rare — most ranges are capped at one pair.'
  }

  if (!spot.heroIsIP) {
    if (tier === 'premium' || tier === 'strong') {
      return 'Strong hands out of position often check to the raiser. Trapping is powerful when villain will bet with a wide range.'
    }
    return 'Out of position, the solver checks a LOT. The information disadvantage means building pots is risky.'
  }

  if (spot.heroIsIP && (tier === 'marginal' || tier === 'weak')) {
    return 'In position with a marginal hand, checking back has value — you get to see a free card and keep the pot small.'
  }

  if (spot.potType === '3bet') {
    return '3-bet pots are larger, so bet sizes as a percentage of pot represent more big blinds. The solver polarizes more in these spots.'
  }

  return 'Postflop play is about range vs range — not just your hand. The solver considers what hands you and villain could both have.'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
