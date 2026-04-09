import { describe, expect, it } from 'vitest'

import type { Spot } from '@/features/trainer/types'

import { buildSpotTypeKey, buildSpotTypeKeyFromSpot, buildTournamentSpotTypeKey } from './spot-type-key'

describe('buildSpotTypeKey', () => {
  it('builds key for open spot (no villain)', () => {
    expect(buildSpotTypeKey('pekarstas', 'UTG', 'RFI', 'AKs')).toBe('pekarstas:UTG:RFI:AKs')
  })

  it('builds key for response spot (with villain)', () => {
    expect(buildSpotTypeKey('greenline', 'BB', 'vs-open', '87s', 'BTN')).toBe(
      'greenline:BB:vs-open:BTN:87s',
    )
  })

  it('is deterministic', () => {
    const a = buildSpotTypeKey('pekarstas', 'CO', 'vs-3bet', 'QQ', 'BB')
    const b = buildSpotTypeKey('pekarstas', 'CO', 'vs-3bet', 'QQ', 'BB')
    expect(a).toBe(b)
  })

  it('produces different keys for different hands at same position', () => {
    const a = buildSpotTypeKey('pekarstas', 'UTG', 'RFI', 'AA')
    const b = buildSpotTypeKey('pekarstas', 'UTG', 'RFI', '72o')
    expect(a).not.toBe(b)
  })

  it('produces different keys for different providers', () => {
    const a = buildSpotTypeKey('pekarstas', 'UTG', 'RFI', 'AA')
    const b = buildSpotTypeKey('greenline', 'UTG', 'RFI', 'AA')
    expect(a).not.toBe(b)
  })
})

describe('buildTournamentSpotTypeKey', () => {
  it('builds key for push spot', () => {
    expect(buildTournamentSpotTypeKey('nash-pushfold', 'BTN', 'push', 'AKs', 10)).toBe(
      'nash-pushfold:BTN:push:10:AKs',
    )
  })

  it('builds key for vs-push spot with villain', () => {
    expect(buildTournamentSpotTypeKey('nash-pushfold', 'BB', 'vs-push', '87s', 15, 'SB')).toBe(
      'nash-pushfold:BB:vs-push:15:SB:87s',
    )
  })

  it('encodes stack depth in key', () => {
    const a = buildTournamentSpotTypeKey('nash-pushfold', 'BTN', 'push', 'AA', 5)
    const b = buildTournamentSpotTypeKey('nash-pushfold', 'BTN', 'push', 'AA', 25)
    expect(a).not.toBe(b)
  })
})

describe('buildSpotTypeKeyFromSpot', () => {
  it('extracts fields from an open spot', () => {
    const spot: Spot = {
      kind: 'open',
      id: 'test-id',
      provider: 'pekarstas',
      hero: 'BTN',
      scenario: 'RFI',
      heroHand: 'AKs',
      heroCards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }],
      cell: 'raise',
      rolledNumber: 50,
      correctAction: 'raise',
    }
    expect(buildSpotTypeKeyFromSpot(spot)).toBe('pekarstas:BTN:RFI:AKs')
  })

  it('includes villain for response spots', () => {
    const spot: Spot = {
      kind: 'response',
      id: 'test-id',
      provider: 'greenline',
      hero: 'BB',
      villain: 'BTN',
      scenario: 'vs-open',
      heroHand: '87s',
      heroCards: [{ rank: '8', suit: 'h' }, { rank: '7', suit: 'h' }],
      cell: 'call',
      rolledNumber: 30,
      correctAction: 'call',
    }
    expect(buildSpotTypeKeyFromSpot(spot)).toBe('greenline:BB:vs-open:BTN:87s')
  })

  it('includes stack depth for push-fold spots', () => {
    const spot: Spot = {
      kind: 'push-fold',
      id: 'test-id',
      provider: 'nash-pushfold',
      hero: 'BTN',
      scenario: 'push',
      heroHand: 'AKs',
      heroCards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }],
      cell: 'allin',
      rolledNumber: 50,
      correctAction: 'allin',
      stackDepth: 10,
    }
    expect(buildSpotTypeKeyFromSpot(spot)).toBe('nash-pushfold:BTN:push:10:AKs')
  })

  it('includes villain in push-fold vs-push key', () => {
    const spot: Spot = {
      kind: 'push-fold',
      id: 'test-id',
      provider: 'nash-pushfold',
      hero: 'BB',
      scenario: 'vs-push',
      villain: 'SB',
      heroHand: 'QQ',
      heroCards: [{ rank: 'Q', suit: 's' }, { rank: 'Q', suit: 'h' }],
      cell: 'call',
      rolledNumber: 50,
      correctAction: 'call',
      stackDepth: 15,
    }
    expect(buildSpotTypeKeyFromSpot(spot)).toBe('nash-pushfold:BB:vs-push:15:SB:QQ')
  })
})
