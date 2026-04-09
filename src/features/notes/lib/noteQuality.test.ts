import { describe, it, expect } from 'vitest'

import { postProcessNote } from './llm7Client'
import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from './notePrompt'
import { GOLDEN_EXAMPLES } from './__fixtures__/goldenExamples'

// ── CI-safe tests (always run, no network) ─────────────────────────

describe('postProcessNote', () => {
  it('strips surrounding double quotes', () => {
    expect(postProcessNote('"BB call 3 streets; station"')).toBe(
      'BB call 3 streets; station'
    )
  })

  it('strips surrounding single quotes', () => {
    expect(postProcessNote("'BTN bluff river; capable'")).toBe(
      'BTN bluff river; capable'
    )
  })

  it('strips "Note:" prefix', () => {
    expect(postProcessNote('Note: UTG limp; passive')).toBe('UTG limp; passive')
  })

  it('strips "Player note:" prefix (case insensitive)', () => {
    expect(postProcessNote('Player Note: CO overbet; nuts')).toBe(
      'CO overbet; nuts'
    )
  })

  it('truncates to 100 chars on word boundary', () => {
    const long =
      'BB call 3 streets with KTo on a very dry board against a tight UTG opener who has been playing very solidly all session long today'
    const result = postProcessNote(long)
    expect(result.length).toBeLessThanOrEqual(100)
    // Should not cut mid-word
    expect(result).not.toMatch(/\s$/)
  })

  it('preserves notes already under 100 chars', () => {
    const note = 'BTN 5b shove w/ QJo; spewy'
    expect(postProcessNote(note)).toBe(note)
  })

  it('trims whitespace', () => {
    expect(postProcessNote('  BB station  ')).toBe('BB station')
  })

  it('handles "standard line" unchanged', () => {
    expect(postProcessNote('standard line')).toBe('standard line')
  })
})

describe('Prompt validation', () => {
  it('system prompt does not contain inline examples', () => {
    // V2 prompt should not have example notes — those live in FEW_SHOT_EXAMPLES
    expect(SYSTEM_PROMPT).not.toContain('UTG limp-4bet')
    expect(SYSTEM_PROMPT).not.toContain('BTN cold4b')
  })

  it('all few-shot output examples are <= 100 chars', () => {
    for (const ex of FEW_SHOT_EXAMPLES) {
      expect(ex.output.length).toBeLessThanOrEqual(100)
    }
  })

  it('few-shot examples cover 6 categories', () => {
    expect(FEW_SHOT_EXAMPLES).toHaveLength(6)
  })

  it('all golden example ideal notes are <= 100 chars', () => {
    for (const ex of GOLDEN_EXAMPLES) {
      expect(ex.idealNote.length).toBeLessThanOrEqual(100)
    }
  })

  it('golden examples have at least 24 entries', () => {
    expect(GOLDEN_EXAMPLES.length).toBeGreaterThanOrEqual(24)
  })

  it('each golden example has at least one requiredSubstring', () => {
    for (const ex of GOLDEN_EXAMPLES) {
      expect(ex.requiredSubstrings.length).toBeGreaterThan(0)
    }
  })
})

// ── LLM integration tests (manual, requires network) ──────────────

const RUN_LLM = import.meta.env?.['RUN_LLM_TESTS'] as string | undefined

describe.skipIf(!RUN_LLM)('LLM integration - golden examples', () => {
  // Increase timeout for LLM API calls
  const LLM_TIMEOUT = 15_000

  it.each(GOLDEN_EXAMPLES)(
    '$id ($category): produces valid note',
    async (example) => {
      const { generateNote } = await import('./llm7Client')
      const note = await generateNote(example.ocrText)

      // Length check
      expect(note.length).toBeLessThanOrEqual(100)

      // Not empty
      expect(note.length).toBeGreaterThan(0)

      // Contains at least one expected signal
      const found = example.requiredSubstrings.some((sub) =>
        note.toLowerCase().includes(sub.toLowerCase())
      )

      if (!found) {
        console.warn(
          `[${example.id}] MISS — expected one of [${example.requiredSubstrings.join(', ')}] in: "${note}"`
        )
      }

      expect(found).toBe(true)
    },
    LLM_TIMEOUT
  )
})
