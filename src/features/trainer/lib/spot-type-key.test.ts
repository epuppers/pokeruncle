import { describe, expect, it } from 'vitest'

import type { Spot } from '@/features/trainer/types'

import { buildSpotTypeKey, buildSpotTypeKeyFromSpot } from './spot-type-key'

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

describe('buildSpotTypeKeyFromSpot', () => {
  it('extracts fields from an open spot', () => {
    const spot: Spot = {
      kind: 'open',
      id: 'test-id',
      provider: 'pekarstas',
      hero: 'BTN',
      scenario: 'RFI',
      heroHand: 'AKs',
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
      cell: 'call',
      rolledNumber: 30,
      correctAction: 'call',
    }
    expect(buildSpotTypeKeyFromSpot(spot)).toBe('greenline:BB:vs-open:BTN:87s')
  })
})
