import { describe, it, expect } from 'vitest'
import {
  getHandRank,
  getHandPercentile,
  getHandTier,
  describeHandStrength,
  getHandFriendlyName,
} from './hand-strength'

describe('getHandRank', () => {
  it('ranks AA as 1 (best)', () => {
    expect(getHandRank('AA')).toBe(1)
  })

  it('ranks 72o as 169 (worst)', () => {
    expect(getHandRank('72o')).toBe(169)
  })

  it('returns undefined for unrecognized hands', () => {
    expect(getHandRank('ZZs')).toBeUndefined()
  })
})

describe('getHandPercentile', () => {
  it('returns top 1% for AA', () => {
    expect(getHandPercentile('AA')).toBe(1)
  })

  it('returns 100% for 72o', () => {
    expect(getHandPercentile('72o')).toBe(100)
  })

  it('returns ~3% for AKs (rank 5)', () => {
    expect(getHandPercentile('AKs')).toBe(3)
  })
})

describe('getHandTier', () => {
  it('classifies AA as premium', () => {
    expect(getHandTier('AA')).toBe('premium')
  })

  it('classifies ATs as strong', () => {
    expect(getHandTier('ATs')).toBe('strong')
  })

  it('classifies 72o as weak', () => {
    expect(getHandTier('72o')).toBe('weak')
  })
})

describe('describeHandStrength', () => {
  it('includes tier and percentile', () => {
    const desc = describeHandStrength('AKs')
    expect(desc).toContain('premium')
    expect(desc).toContain('top 3%')
  })
})

describe('getHandFriendlyName', () => {
  it('names suited hands', () => {
    expect(getHandFriendlyName('AKs')).toBe('Ace-King suited')
  })

  it('names offsuit hands', () => {
    expect(getHandFriendlyName('AKo')).toBe('Ace-King offsuit')
  })

  it('names pairs', () => {
    expect(getHandFriendlyName('AA')).toBe('pair of Aces')
  })

  it('names number cards', () => {
    expect(getHandFriendlyName('87s')).toBe('Eight-Seven suited')
  })
})
