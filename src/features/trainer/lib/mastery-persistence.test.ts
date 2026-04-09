import { afterEach, describe, expect, it } from 'vitest'

import { db } from '@/lib/db'

import type { Spot } from '@/features/trainer/types'

import { getMasteryRecord, getMasteryRecordsForProvider, recordSpotResult } from './mastery-persistence'

const openSpot: Spot = {
  kind: 'open',
  id: 'spot-1',
  provider: 'pekarstas',
  hero: 'UTG',
  scenario: 'RFI',
  heroHand: 'AKs',
  heroCards: [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }],
  cell: 'raise',
  rolledNumber: 50,
  correctAction: 'raise',
}

const responseSpot: Spot = {
  kind: 'response',
  id: 'spot-2',
  provider: 'pekarstas',
  hero: 'BB',
  villain: 'BTN',
  scenario: 'vs-open',
  heroHand: '87s',
  heroCards: [{ rank: '8', suit: 'h' }, { rank: '7', suit: 'h' }],
  cell: 'call',
  rolledNumber: 30,
  correctAction: 'call',
}

afterEach(async () => {
  await db.spotResults.clear()
  await db.masteryRecords.clear()
})

describe('recordSpotResult', () => {
  it('writes a SpotResultRecord to the database', async () => {
    await recordSpotResult(openSpot, 'raise', 1500)

    const results = await db.spotResults.toArray()
    expect(results).toHaveLength(1)
    expect(results[0].spotId).toBe('spot-1')
    expect(results[0].userAction).toBe('raise')
    expect(results[0].isCorrect).toBe(true)
    expect(results[0].evLossEstimate).toBe(0)
    expect(results[0].qualityScore).toBe(5)
    expect(results[0].decisionTimeMs).toBe(1500)
  })

  it('records EV loss for wrong answers on pure-strategy cells', async () => {
    await recordSpotResult(openSpot, 'fold', 2000)

    const results = await db.spotResults.toArray()
    expect(results[0].isCorrect).toBe(false)
    expect(results[0].evLossEstimate).toBe(0.5)
    expect(results[0].qualityScore).toBeLessThan(5)
  })

  it('creates a mastery record on first answer', async () => {
    await recordSpotResult(openSpot, 'raise', 1000)

    const mastery = await getMasteryRecord('pekarstas:UTG:RFI:AKs')
    expect(mastery).toBeDefined()
    expect(mastery!.repetitions).toBe(1)
    expect(mastery!.easeFactor).toBeGreaterThan(2.4)
  })

  it('updates existing mastery record on subsequent answers', async () => {
    await recordSpotResult(openSpot, 'raise', 1000)
    await recordSpotResult(openSpot, 'raise', 800)

    const mastery = await getMasteryRecord('pekarstas:UTG:RFI:AKs')
    expect(mastery!.repetitions).toBe(2)
  })

  it('resets mastery on failure', async () => {
    // Two correct to build up
    await recordSpotResult(openSpot, 'raise', 1000)
    await recordSpotResult(openSpot, 'raise', 1000)
    const before = await getMasteryRecord('pekarstas:UTG:RFI:AKs')
    expect(before!.repetitions).toBe(2)

    // One wrong to reset
    await recordSpotResult(openSpot, 'fold', 1000)
    const after = await getMasteryRecord('pekarstas:UTG:RFI:AKs')
    expect(after!.repetitions).toBe(0)
    expect(after!.interval).toBe(1)
  })
})

describe('getMasteryRecordsForProvider', () => {
  it('returns only records for the specified provider', async () => {
    await recordSpotResult(openSpot, 'raise', 1000)
    await recordSpotResult(responseSpot, 'call', 1000)

    const records = await getMasteryRecordsForProvider('pekarstas')
    expect(records).toHaveLength(2)

    const greenlineRecords = await getMasteryRecordsForProvider('greenline')
    expect(greenlineRecords).toHaveLength(0)
  })
})

describe('getMasteryRecord', () => {
  it('returns undefined for unknown keys', async () => {
    const record = await getMasteryRecord('nonexistent:key')
    expect(record).toBeUndefined()
  })
})
