import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeSimilarity, nonMaxSuppression, detectBoardCards } from './cardDetector'
import type { DetectedCard } from './cardDetector'

// --- Canvas mocking (follows imagePreprocessor.test.ts pattern) ---

function createMockCanvas() {
  let w = 0
  let h = 0
  const pixelData = new Uint8ClampedArray(4000 * 4000 * 4)
  const imageData = { data: pixelData, width: 0, height: 0 }

  const ctx = {
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, gw: number, gh: number) => {
      imageData.width = gw
      imageData.height = gh
      return imageData
    }),
    putImageData: vi.fn(),
    imageSmoothingEnabled: true,
  }

  const canvas = {
    get width() { return w },
    set width(v: number) { w = v },
    get height() { return h },
    set height(v: number) { h = v },
    getContext: vi.fn(() => ctx),
  }

  return { canvas, ctx, imageData, pixelData }
}

function mockImage(w: number, h: number): HTMLImageElement {
  const img = new Image()
  Object.defineProperty(img, 'naturalWidth', { value: w })
  Object.defineProperty(img, 'naturalHeight', { value: h })
  return img
}

// --- computeSimilarity tests ---

describe('computeSimilarity', () => {
  it('returns 1.0 for identical pixel data', () => {
    const w = 4
    const h = 4
    const data = new Uint8ClampedArray(w * h * 4)
    // Fill with uniform color
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128
      data[i + 1] = 64
      data[i + 2] = 200
      data[i + 3] = 255
    }

    const score = computeSimilarity(data, w, data, w, h, 0, 0)
    expect(score).toBe(1)
  })

  it('returns low score for completely different data', () => {
    const w = 4
    const h = 4
    const src = new Uint8ClampedArray(w * h * 4)
    const tpl = new Uint8ClampedArray(w * h * 4)

    // Source: all black
    for (let i = 0; i < src.length; i += 4) {
      src[i] = 0; src[i + 1] = 0; src[i + 2] = 0; src[i + 3] = 255
    }
    // Template: all white
    for (let i = 0; i < tpl.length; i += 4) {
      tpl[i] = 255; tpl[i + 1] = 255; tpl[i + 2] = 255; tpl[i + 3] = 255
    }

    const score = computeSimilarity(src, w, tpl, w, h, 0, 0)
    // SAD per pixel = 255*3 = 765, normalized: 1 - 765/765 = 0
    expect(score).toBeCloseTo(0, 5)
  })

  it('handles offset within larger source', () => {
    const srcW = 8
    const srcH = 4
    const tplW = 4
    const tplH = 4
    const src = new Uint8ClampedArray(srcW * srcH * 4)
    const tpl = new Uint8ClampedArray(tplW * tplH * 4)

    // Place matching pattern at offset x=4 in source
    const color = [100, 150, 200]
    for (let i = 0; i < tpl.length; i += 4) {
      tpl[i] = color[0]; tpl[i + 1] = color[1]; tpl[i + 2] = color[2]; tpl[i + 3] = 255
    }
    for (let y = 0; y < srcH; y++) {
      for (let x = 4; x < 8; x++) {
        const i = (y * srcW + x) * 4
        src[i] = color[0]; src[i + 1] = color[1]; src[i + 2] = color[2]; src[i + 3] = 255
      }
    }

    const score = computeSimilarity(src, srcW, tpl, tplW, tplH, 4, 0)
    expect(score).toBe(1)
  })
})

// --- nonMaxSuppression tests ---

describe('nonMaxSuppression', () => {
  it('keeps non-overlapping detections', () => {
    const detections: DetectedCard[] = [
      { card: { rank: 'A', suit: 's' }, confidence: 0.95, x: 0 },
      { card: { rank: 'K', suit: 'h' }, confidence: 0.90, x: 100 },
    ]

    const result = nonMaxSuppression(detections, 40)
    expect(result).toHaveLength(2)
  })

  it('keeps only higher confidence when detections overlap', () => {
    const detections: DetectedCard[] = [
      { card: { rank: 'A', suit: 's' }, confidence: 0.95, x: 10 },
      { card: { rank: 'K', suit: 'h' }, confidence: 0.90, x: 15 }, // overlaps (within 40*0.5=20px)
    ]

    const result = nonMaxSuppression(detections, 40)
    expect(result).toHaveLength(1)
    expect(result[0].card.rank).toBe('A')
  })

  it('handles empty input', () => {
    const result = nonMaxSuppression([], 40)
    expect(result).toHaveLength(0)
  })

  it('keeps multiple non-overlapping detections from many candidates', () => {
    const detections: DetectedCard[] = [
      { card: { rank: 'A', suit: 's' }, confidence: 0.95, x: 0 },
      { card: { rank: '2', suit: 'c' }, confidence: 0.85, x: 5 },   // overlaps with A
      { card: { rank: 'K', suit: 'h' }, confidence: 0.92, x: 50 },
      { card: { rank: 'Q', suit: 'd' }, confidence: 0.91, x: 100 },
    ]

    const result = nonMaxSuppression(detections, 40)
    expect(result).toHaveLength(3) // A at 0, K at 50, Q at 100
    expect(result.map(d => d.card.rank)).toContain('A')
    expect(result.map(d => d.card.rank)).toContain('K')
    expect(result.map(d => d.card.rank)).toContain('Q')
  })
})

// --- detectBoardCards integration tests ---

describe('detectBoardCards', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const mock = createMockCanvas()
        return mock.canvas as unknown as HTMLCanvasElement
      }
      return originalCreateElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns warnings when no templates can be loaded', async () => {
    // Mock fetch to fail for all templates
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Not found'))

    // Mock Image to fail loading
    const OriginalImage = globalThis.Image
    vi.stubGlobal('Image', class extends OriginalImage {
      constructor() {
        super()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        setTimeout(() => this.onerror?.(new Event('error')), 0)
      }
    })

    const image = mockImage(1920, 1080)
    const result = await detectBoardCards(image)

    expect(result.cards).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })
})
