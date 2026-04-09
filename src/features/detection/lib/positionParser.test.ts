import { describe, it, expect } from 'vitest'
import { parseActions, parsePositions, inferPositions } from './positionParser'

describe('parseActions', () => {
  it('parses English action log', () => {
    const text = 'UTG Raise $0.25\nCO Call $0.25\nBTN Fold'
    const actions = parseActions(text)

    expect(actions).toEqual([
      { position: 'UTG', action: 'raise', amount: 0.25 },
      { position: 'CO', action: 'call', amount: 0.25 },
      { position: 'BTN', action: 'fold', amount: undefined },
    ])
  })

  it('parses Russian action log', () => {
    const text = 'BTN Рейз $5\nBB Колл $5\nSB Фолд'
    const actions = parseActions(text)

    expect(actions).toEqual([
      { position: 'BTN', action: 'raise', amount: 5 },
      { position: 'BB', action: 'call', amount: 5 },
      { position: 'SB', action: 'fold', amount: undefined },
    ])
  })

  it('parses all-in actions', () => {
    const text = 'SB Raise $5\nBB All-in $100'
    const actions = parseActions(text)

    expect(actions).toHaveLength(2)
    expect(actions[1]).toEqual({ position: 'BB', action: 'allin', amount: 100 })
  })

  it('parses Russian all-in', () => {
    const text = 'CO Олл-ин $50'
    const actions = parseActions(text)

    expect(actions).toHaveLength(1)
    expect(actions[0].action).toBe('allin')
  })

  it('parses check and bet', () => {
    const text = 'BB Check\nUTG Bet $0.50'
    const actions = parseActions(text)

    expect(actions).toEqual([
      { position: 'BB', action: 'check', amount: undefined },
      { position: 'UTG', action: 'bet', amount: 0.5 },
    ])
  })

  it('returns empty array for garbage text', () => {
    const actions = parseActions('asdfghjkl 12345 no poker here')
    expect(actions).toEqual([])
  })

  it('skips lines without a position', () => {
    const text = 'Raise $5\nBTN Call $5'
    const actions = parseActions(text)

    expect(actions).toHaveLength(1)
    expect(actions[0].position).toBe('BTN')
  })

  it('handles OCR misread 8TN as BTN', () => {
    const text = '8TN Raise $5'
    const actions = parseActions(text)

    expect(actions).toHaveLength(1)
    expect(actions[0].position).toBe('BTN')
  })
})

describe('inferPositions', () => {
  it('returns nulls for empty actions', () => {
    const result = inferPositions([])

    expect(result.oopPosition).toBeNull()
    expect(result.ipPosition).toBeNull()
    expect(result.potType).toBeNull()
    expect(result.warnings).toContain('No actions detected in OCR text')
  })

  it('detects SRP with correct OOP/IP', () => {
    const result = inferPositions([
      { position: 'UTG', action: 'raise', amount: 0.25 },
      { position: 'CO', action: 'call', amount: 0.25 },
      { position: 'BTN', action: 'fold' },
    ])

    expect(result.potType).toBe('srp')
    expect(result.oopPosition).toBe('UTG')
    expect(result.ipPosition).toBe('CO')
    expect(result.warnings).toHaveLength(0)
  })

  it('detects 3bet pot', () => {
    const result = inferPositions([
      { position: 'CO', action: 'raise', amount: 2.5 },
      { position: 'BTN', action: 'raise', amount: 8 },
      { position: 'CO', action: 'call', amount: 8 },
    ])

    expect(result.potType).toBe('3bet')
    expect(result.oopPosition).toBe('CO')
    expect(result.ipPosition).toBe('BTN')
  })

  it('handles all-in as a raise for pot type', () => {
    const result = inferPositions([
      { position: 'SB', action: 'raise', amount: 5 },
      { position: 'BB', action: 'allin', amount: 100 },
      { position: 'SB', action: 'call', amount: 95 },
    ])

    expect(result.potType).toBe('3bet')
    expect(result.oopPosition).toBe('SB')
    expect(result.ipPosition).toBe('BB')
  })

  it('warns on multiway pot', () => {
    const result = inferPositions([
      { position: 'UTG', action: 'raise', amount: 2.5 },
      { position: 'MP', action: 'call', amount: 2.5 },
      { position: 'CO', action: 'call', amount: 2.5 },
    ])

    expect(result.potType).toBe('srp')
    expect(result.warnings).toContain('Multiway pot detected — showing heads-up approximation')
    // OOP = UTG (earliest in postflop order), IP = CO (latest)
    expect(result.oopPosition).toBe('UTG')
    expect(result.ipPosition).toBe('CO')
  })

  it('handles single active player', () => {
    const result = inferPositions([
      { position: 'BTN', action: 'raise', amount: 2.5 },
      { position: 'SB', action: 'fold' },
      { position: 'BB', action: 'fold' },
    ])

    expect(result.oopPosition).toBe('BTN')
    expect(result.ipPosition).toBeNull()
    expect(result.warnings).toContain('Only one active player detected')
  })

  it('handles everyone folded', () => {
    const result = inferPositions([
      { position: 'UTG', action: 'fold' },
      { position: 'MP', action: 'fold' },
    ])

    expect(result.oopPosition).toBeNull()
    expect(result.ipPosition).toBeNull()
    expect(result.warnings).toContain('All players folded — no flop')
  })

  it('determines OOP/IP by postflop order (SB before BTN)', () => {
    const result = inferPositions([
      { position: 'BTN', action: 'raise', amount: 3 },
      { position: 'SB', action: 'call', amount: 3 },
      { position: 'BB', action: 'fold' },
    ])

    expect(result.oopPosition).toBe('SB')
    expect(result.ipPosition).toBe('BTN')
  })

  it('determines OOP/IP by postflop order (BB before CO)', () => {
    const result = inferPositions([
      { position: 'CO', action: 'raise', amount: 2.5 },
      { position: 'BB', action: 'call', amount: 2.5 },
    ])

    expect(result.oopPosition).toBe('BB')
    expect(result.ipPosition).toBe('CO')
  })
})

describe('parsePositions (end-to-end)', () => {
  it('parses English SRP correctly', () => {
    const result = parsePositions('UTG Raise $0.25\nCO Call $0.25\nBTN Fold')

    expect(result.potType).toBe('srp')
    expect(result.oopPosition).toBe('UTG')
    expect(result.ipPosition).toBe('CO')
  })

  it('parses Russian 3bet pot correctly', () => {
    const result = parsePositions('CO Рейз $2.50\nBTN Рейз $8\nCO Колл $8')

    expect(result.potType).toBe('3bet')
    expect(result.oopPosition).toBe('CO')
    expect(result.ipPosition).toBe('BTN')
  })

  it('returns warnings for empty text', () => {
    const result = parsePositions('')

    expect(result.oopPosition).toBeNull()
    expect(result.ipPosition).toBeNull()
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
