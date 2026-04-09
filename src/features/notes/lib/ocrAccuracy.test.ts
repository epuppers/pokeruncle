/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const FIXTURES_DIR = join(__dirname, '__fixtures__')

interface Fixture {
  name: string
  imgPath: string
  expectedSubstrings: string[]
}

function loadFixtures(): Fixture[] {
  if (!existsSync(FIXTURES_DIR)) return []

  const files = readdirSync(FIXTURES_DIR)
  return files
    .filter((f: string) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((imgFile: string) => {
      const name = imgFile.replace(/\.[^.]+$/, '')
      const expectedFile = join(FIXTURES_DIR, `${name}.expected.txt`)
      const expectedSubstrings = existsSync(expectedFile)
        ? readFileSync(expectedFile, 'utf-8')
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
        : []
      return { name, imgPath: join(FIXTURES_DIR, imgFile), expectedSubstrings }
    })
}

/**
 * Integration test harness for OCR accuracy on real GGPoker screenshots.
 *
 * To use:
 * 1. Place GGPoker hand replay screenshots in __fixtures__/ (e.g., hand1.png)
 * 2. Create a matching .expected.txt file (e.g., hand1.expected.txt)
 *    with one expected substring per line
 * 3. Remove the .skip to run: `bunx --bun vitest run ocrAccuracy`
 *
 * These tests require a real Canvas implementation (not jsdom).
 */
describe.skip('OCR accuracy on GGPoker fixtures', () => {
  const fixtures = loadFixtures()

  it.each(fixtures)('extracts expected text from $name', async ({ imgPath, expectedSubstrings }: Fixture) => {
    const { loadImage, preprocessForOcr } = await import('./imagePreprocessor')
    const { recognizeText } = await import('./tesseractWorker')
    const { GGPOKER_PRESET } = await import('./presets')

    const imgBuffer = readFileSync(imgPath)
    const ext = imgPath.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const dataUrl = `data:${mime};base64,${imgBuffer.toString('base64')}`

    const img = await loadImage(dataUrl)
    const preprocessed = preprocessForOcr(img, GGPOKER_PRESET)
    const text = await recognizeText(preprocessed)

    for (const expected of expectedSubstrings) {
      expect(text.toLowerCase()).toContain(expected.toLowerCase())
    }
  })
})
