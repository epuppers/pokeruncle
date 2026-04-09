import { describe, it, expect } from 'vitest'

import { parseTexasSolverCard, comboToHandClass, combosPerHandClass } from './notation'

describe('parseTexasSolverCard', () => {
  it('parses a standard card', () => {
    expect(parseTexasSolverCard('AH')).toEqual({ rank: 'A', suit: 'h' })
  })

  it('parses ten as T', () => {
    expect(parseTexasSolverCard('TD')).toEqual({ rank: 'T', suit: 'd' })
  })

  it('handles lowercase suit in input', () => {
    expect(parseTexasSolverCard('Ks')).toEqual({ rank: 'K', suit: 's' })
  })

  it('throws on invalid rank', () => {
    expect(() => parseTexasSolverCard('XH')).toThrow('Invalid rank')
  })

  it('throws on invalid suit', () => {
    expect(() => parseTexasSolverCard('AX')).toThrow('Invalid suit')
  })

  it('throws on wrong length', () => {
    expect(() => parseTexasSolverCard('A')).toThrow('Invalid card string')
  })
})

describe('comboToHandClass', () => {
  it('converts a pair', () => {
    expect(comboToHandClass('AHAD')).toBe('AA')
  })

  it('converts a suited hand with higher rank first', () => {
    expect(comboToHandClass('AHKH')).toBe('AKs')
  })

  it('converts a suited hand with lower rank first', () => {
    expect(comboToHandClass('KHAH')).toBe('AKs')
  })

  it('converts an offsuit hand', () => {
    expect(comboToHandClass('AHKD')).toBe('AKo')
  })

  it('handles space-separated format', () => {
    expect(comboToHandClass('AH KD')).toBe('AKo')
  })

  it('converts low cards correctly', () => {
    expect(comboToHandClass('2H3H')).toBe('32s')
  })

  it('converts middle cards correctly', () => {
    expect(comboToHandClass('THJH')).toBe('JTs')
  })

  it('throws on invalid combo', () => {
    expect(() => comboToHandClass('AH')).toThrow('Invalid combo string')
  })
})

describe('combosPerHandClass', () => {
  it('returns 6 for pairs', () => {
    expect(combosPerHandClass('AA')).toBe(6)
    expect(combosPerHandClass('22')).toBe(6)
  })

  it('returns 4 for suited hands', () => {
    expect(combosPerHandClass('AKs')).toBe(4)
  })

  it('returns 12 for offsuit hands', () => {
    expect(combosPerHandClass('AKo')).toBe(12)
  })
})
