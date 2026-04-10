import type { Position } from '@/types/poker'
import { positionLabel } from '@/lib/poker-glossary'

import type { Spot, SpotResult } from '@/features/trainer/types'
import { describeHandStrength, getHandFriendlyName, getHandTier } from './hand-strength'
import { describePot, formatDollars, getRaiseAmount } from './money'

export interface FeedbackContent {
  /** "Nice!" or "Not quite." */
  headline: string
  /** Hand strength in plain English: "Ace-King suited is a premium hand (top 3%)" */
  handContext: string
  /** Why position matters here */
  positionContext: string
  /** Why the correct action is correct */
  reasoning: string
  /** A memorable takeaway */
  tip: string
}

/** Generate structured teaching feedback for a spot result */
export function generateFeedback(spot: Spot, result: SpotResult): FeedbackContent {
  const handName = getHandFriendlyName(spot.heroHand)
  const strengthDesc = describeHandStrength(spot.heroHand)
  const heroPos = spot.hero
  const posDesc = describePosition(heroPos)

  const headline = result.isCorrect ? 'Nice!' : 'Not quite.'
  const handContext = `${capitalize(handName)} is ${strengthDesc}.`
  const positionContext = posDesc
  const reasoning = buildReasoning(spot)
  const tip = buildTip(spot)

  return { headline, handContext, positionContext, reasoning, tip }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function describePosition(pos: Position): string {
  const name = positionLabel(pos)
  switch (pos) {
    case 'UTG':
      return `From ${name} — the first to act — you need a strong hand because all five other players act after you.`
    case 'MP':
      return `From ${name}, four players still act after you, so you need a fairly strong hand.`
    case 'CO':
      return `From the ${name}, you're in a strong late position — only two players act after you.`
    case 'BTN':
      return `From the ${name} seat (the best position), you act last after the flop, so you can play more hands.`
    case 'SB':
      return `From the ${name}, you've already put ${formatDollars(1)} in, but you'll act first after the flop — a tough spot.`
    case 'BB':
      return `From the ${name}, you've already put ${formatDollars(2)} in, so you're getting a discount to see the flop.`
  }
}

function buildReasoning(spot: Spot): string {
  const tier = getHandTier(spot.heroHand)
  const action = spot.correctAction
  const pot = describePot(spot.scenario)

  if (spot.kind === 'push-fold') {
    return buildPushFoldReasoning(spot)
  }

  switch (action) {
    case 'raise':
      return buildRaiseReasoning(spot, tier, pot)
    case 'call':
      return buildCallReasoning(spot, tier, pot)
    case 'fold':
      return buildFoldReasoning(spot, tier)
    case 'allin':
      return `With ${pot}, going all-in puts maximum pressure on your opponent. Your hand is strong enough to commit all your chips here.`
  }
}

function buildRaiseReasoning(
  spot: Spot,
  tier: string,
  pot: string,
): string {
  const raiseAmt = formatDollars(getRaiseAmount(spot.scenario))

  switch (spot.scenario) {
    case 'RFI': {
      if (tier === 'premium' || tier === 'strong') {
        return `Raising to ${raiseAmt} with ${pot} up for grabs is straightforward. Your hand is strong enough to open from any seat.`
      }
      if (tier === 'playable') {
        return `Raising to ${raiseAmt} here is correct because your position lets you play this hand profitably. You'll often win the ${pot} right away.`
      }
      return `Even though this isn't a monster hand, raising to ${raiseAmt} is profitable here. Your position makes up for the hand's weakness.`
    }
    case 'vs-open': {
      return `Re-raising to ${raiseAmt} puts pressure on the opener. Your hand is strong enough to fight back here rather than just calling.`
    }
    case 'vs-3bet': {
      return `Raising again to ${raiseAmt} shows real strength. Your hand is strong enough to keep escalating the betting.`
    }
    case 'vs-4bet':
      return `Even facing a 4-bet, your hand is strong enough to push back. This is a premium spot that warrants aggression.`
    case '3bet-defense':
      return `After your re-raise was called, raising again keeps the pressure on. You led the aggression and should follow through.`
    default:
      return `Raising is the best play here given your hand strength and position.`
  }
}

function buildCallReasoning(
  spot: Spot,
  tier: string,
  pot: string,
): string {
  switch (spot.scenario) {
    case 'vs-open': {
      const callAmt = formatDollars(getRaiseAmount('RFI'))
      if (tier === 'playable' || tier === 'marginal') {
        return `Calling ${callAmt} is correct here. Your hand isn't strong enough to re-raise, but it's too good to fold with ${pot}. You'll see the flop and play from there.`
      }
      return `Calling ${callAmt} with ${pot} keeps you in the hand at a good price. Re-raising would be too aggressive with this hand, but folding throws away a profitable spot.`
    }
    case 'vs-3bet': {
      const callAmt = formatDollars(getRaiseAmount('vs-open'))
      return `Calling the re-raise of ${callAmt} is correct. Your hand can't quite raise again, but it's strong enough to see the flop at this price.`
    }
    case 'vs-4bet': {
      return `Calling the 4-bet keeps you in a huge pot. Your hand is strong enough to take a flop but not quite strong enough to go all-in.`
    }
    default:
      return `Calling is the right play — your hand is worth seeing the next cards but not strong enough to raise.`
  }
}

function buildFoldReasoning(spot: Spot, tier: string): string {
  if (spot.kind === 'open') {
    if (tier === 'weak') {
      return `This hand is too weak to open from this seat. Playing it would lose money in the long run because you'll face strong hands behind you.`
    }
    return `Even though this hand has some potential, it's not strong enough to raise from this seat. The players behind you could have much stronger hands.`
  }

  switch (spot.scenario) {
    case 'vs-open':
      return `Facing a raise, this hand isn't strong enough to continue. Calling or re-raising here would lose money over time. Wait for a better spot.`
    case 'vs-3bet':
      return `Facing a re-raise, you're up against a strong range of hands. Your hand doesn't play well enough to call or raise here.`
    case 'vs-4bet':
      return `When someone 4-bets, they usually have a very strong hand. Yours isn't strong enough to risk more chips. Folding saves your stack for a better opportunity.`
    case '3bet-defense':
      return `After the aggression so far, folding might feel wrong, but this hand isn't strong enough to continue profitably.`
    default:
      return `Folding saves your chips for a better opportunity. Not every hand is worth playing.`
  }
}

function buildPushFoldReasoning(spot: Spot & { kind: 'push-fold' }): string {
  const stack = formatDollars(spot.stackDepth * 2)

  if (spot.scenario === 'push') {
    if (spot.correctAction === 'allin') {
      return `With a short stack of ${stack}, pushing all-in is profitable. You have enough strength to steal the blinds, and if you get called, you still have a fighting chance.`
    }
    return `With a short stack of ${stack}, this hand isn't strong enough to risk everything. Wait for a better hand to push with.`
  }

  // vs-push
  if (spot.correctAction === 'call') {
    return `Your hand is strong enough to call the all-in. Against the range of hands your opponent would push with, you'll win often enough to make this profitable.`
  }
  return `Even though someone went all-in, your hand isn't strong enough to call. The risk is too high compared to your chances of winning.`
}

function buildTip(spot: Spot): string {
  const tier = getHandTier(spot.heroHand)
  const action = spot.correctAction

  if (action === 'fold') {
    if (tier === 'marginal' || tier === 'playable') {
      return 'Position matters a lot for borderline hands — the same hand might be a raise from the Dealer but a fold from Under the Gun.'
    }
    return 'Folding weak hands is one of the most important skills in poker. Patience pays off.'
  }

  if (action === 'raise' && spot.scenario === 'RFI') {
    if (tier === 'premium') {
      return 'Premium hands should almost always be raised. The key is getting money in the pot while you have the best hand.'
    }
    return 'In late position, you can raise more hands because fewer players act after you. Position is power.'
  }

  if (action === 'call') {
    return 'Calling keeps the pot small while keeping you in the hand. Good for hands that have potential but aren\'t strong enough to raise.'
  }

  if (action === 'allin') {
    return 'Going all-in is a big decision. It\'s correct when your hand is strong enough and the pot is giving you good odds.'
  }

  return 'Every decision in poker is about balancing risk and reward based on your hand, position, and the situation.'
}
