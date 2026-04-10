import { describe, it, expect } from 'vitest'
import {
  formatDollars,
  getBlindAmount,
  getBlindPot,
  getRaiseAmount,
  getCallAmount,
  getActionButtonLabel,
  describePot,
} from './money'

describe('formatDollars', () => {
  it('formats integer amounts with dollar sign', () => {
    expect(formatDollars(1)).toBe('$1')
    expect(formatDollars(200)).toBe('$200')
  })
})

describe('getBlindAmount', () => {
  it('returns $1 for SB and $2 for BB', () => {
    expect(getBlindAmount('SB')).toBe(1)
    expect(getBlindAmount('BB')).toBe(2)
  })
})

describe('getBlindPot', () => {
  it('returns $3 for standard $1/$2', () => {
    expect(getBlindPot()).toBe(3)
  })
})

describe('getRaiseAmount', () => {
  it('returns $6 for a standard open raise', () => {
    expect(getRaiseAmount('RFI')).toBe(6)
  })

  it('returns $18 for a 3-bet', () => {
    expect(getRaiseAmount('vs-open')).toBe(18)
  })

  it('returns $48 for a 4-bet', () => {
    expect(getRaiseAmount('vs-3bet')).toBe(48)
  })
})

describe('getCallAmount', () => {
  it('returns $6 for calling an open', () => {
    expect(getCallAmount('vs-open')).toBe(6)
  })

  it('returns $18 for calling a 3-bet', () => {
    expect(getCallAmount('vs-3bet')).toBe(18)
  })
})

describe('getActionButtonLabel', () => {
  it('shows dollar amount on call buttons', () => {
    expect(getActionButtonLabel('call', 'vs-open')).toBe('Call $6')
  })

  it('shows raise-to amount', () => {
    expect(getActionButtonLabel('raise', 'RFI')).toBe('Raise to $6')
  })

  it('shows fold without amount', () => {
    expect(getActionButtonLabel('fold', 'RFI')).toBe('Fold')
  })

  it('shows all-in with full stack', () => {
    expect(getActionButtonLabel('allin', 'RFI')).toBe('All-in $200')
  })

  it('caps amounts at stack for push-fold', () => {
    expect(getActionButtonLabel('allin', 'push', 10)).toBe('All-in $20')
  })
})

describe('describePot', () => {
  it('describes blind pot for RFI', () => {
    expect(describePot('RFI')).toBe('$3 in blinds')
  })

  it('describes pot for vs-open', () => {
    expect(describePot('vs-open')).toBe('about $9 in the pot')
  })
})
