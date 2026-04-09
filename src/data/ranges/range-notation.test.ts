import { describe, it, expect } from 'vitest'
import { expandRange } from './range-notation'

describe('expandRange', () => {
  it('expands a single hand', () => {
    expect(expandRange('AKs')).toEqual(['AKs'])
  })

  it('expands a single pair', () => {
    expect(expandRange('AA')).toEqual(['AA'])
  })

  it('expands pair+ notation', () => {
    expect(expandRange('TT+')).toEqual(['TT', 'JJ', 'QQ', 'KK', 'AA'])
  })

  it('expands 22+ to all pairs', () => {
    const result = expandRange('22+')
    expect(result).toHaveLength(13)
    expect(result[0]).toBe('22')
    expect(result[12]).toBe('AA')
  })

  it('expands pair range', () => {
    expect(expandRange('55-88')).toEqual(['55', '66', '77', '88'])
  })

  it('expands suited+ notation', () => {
    expect(expandRange('ATs+')).toEqual(['ATs', 'AJs', 'AQs', 'AKs'])
  })

  it('expands suited+ from lowest kicker', () => {
    expect(expandRange('A2s+')).toHaveLength(12) // A2s through AKs
    expect(expandRange('A2s+')[0]).toBe('A2s')
    expect(expandRange('A2s+')[11]).toBe('AKs')
  })

  it('expands offsuit+ notation', () => {
    expect(expandRange('KTo+')).toEqual(['KTo', 'KJo', 'KQo'])
  })

  it('expands suited sub-range', () => {
    expect(expandRange('K9s-KJs')).toEqual(['K9s', 'KTs', 'KJs'])
  })

  it('expands offsuit sub-range', () => {
    expect(expandRange('Q9o-QJo')).toEqual(['Q9o', 'QTo', 'QJo'])
  })

  it('expands a comma-separated list', () => {
    const result = expandRange('AA, AKs, AKo')
    expect(result).toEqual(['AA', 'AKs', 'AKo'])
  })

  it('expands a complex range', () => {
    const result = expandRange('TT+, ATs+, KQs, AJo+')
    expect(result).toContain('TT')
    expect(result).toContain('AA')
    expect(result).toContain('ATs')
    expect(result).toContain('AKs')
    expect(result).toContain('KQs')
    expect(result).toContain('AJo')
    expect(result).toContain('AKo')
  })
})
