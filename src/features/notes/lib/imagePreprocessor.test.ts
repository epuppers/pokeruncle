import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cropToRegion, scaleCanvas, binarize } from './imagePreprocessor'

// Mock canvas with mutable width/height and working context
function createMockCanvas() {
  let w = 0
  let h = 0
  const pixelData = new Uint8ClampedArray(4000 * 4000 * 4) // generous buffer
  const imageData = { data: pixelData, width: 0, height: 0 }

  const ctx = {
    drawImage: vi.fn(),
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
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  }

  return { canvas, ctx, imageData, pixelData }
}

const originalCreateElement = document.createElement.bind(document)
let createdCanvases: ReturnType<typeof createMockCanvas>[]

beforeEach(() => {
  createdCanvases = []
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      const mock = createMockCanvas()
      createdCanvases.push(mock)
      return mock.canvas as unknown as HTMLCanvasElement
    }
    return originalCreateElement(tag)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockImage(w: number, h: number): HTMLImageElement {
  const img = new Image()
  Object.defineProperty(img, 'naturalWidth', { value: w })
  Object.defineProperty(img, 'naturalHeight', { value: h })
  return img
}

describe('cropToRegion', () => {
  it('computes correct pixel coordinates from fractional region', () => {
    const image = mockImage(1000, 800)
    const region = { x: 0, y: 0.55, width: 1, height: 0.45 }

    const result = cropToRegion(image, region)

    expect(result.width).toBe(1000)
    expect(result.height).toBe(360) // 0.45 * 800

    const ctx = createdCanvases[0].ctx
    expect(ctx.drawImage).toHaveBeenCalledWith(
      image, 0, 440, 1000, 360, 0, 0, 1000, 360
    )
  })

  it('handles partial width regions', () => {
    const image = mockImage(500, 500)
    const region = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }

    const result = cropToRegion(image, region)

    expect(result.width).toBe(250)
    expect(result.height).toBe(250)
  })
})

describe('scaleCanvas', () => {
  it('returns source canvas when factor is 1', () => {
    const source = createMockCanvas()
    source.canvas.width = 100
    source.canvas.height = 100
    const result = scaleCanvas(source.canvas as unknown as HTMLCanvasElement, 1)
    expect(result).toBe(source.canvas)
  })

  it('doubles dimensions when factor is 2', () => {
    const source = createMockCanvas()
    source.canvas.width = 100
    source.canvas.height = 80
    const result = scaleCanvas(source.canvas as unknown as HTMLCanvasElement, 2)
    expect(result.width).toBe(200)
    expect(result.height).toBe(160)
  })
})

describe('binarize', () => {
  it('applies threshold correctly', () => {
    const mock = createMockCanvas()
    mock.canvas.width = 2
    mock.canvas.height = 1
    const data = mock.pixelData

    // Pixel 0: bright (200) → above threshold 128 → 255
    data[0] = 200; data[1] = 200; data[2] = 200; data[3] = 255
    // Pixel 1: dark (50) → below threshold 128 → 0
    data[4] = 50; data[5] = 50; data[6] = 50; data[7] = 255

    binarize(mock.canvas as unknown as HTMLCanvasElement, 128, false)

    expect(data[0]).toBe(255)
    expect(data[4]).toBe(0)
  })

  it('inverts output when invert is true', () => {
    const mock = createMockCanvas()
    mock.canvas.width = 2
    mock.canvas.height = 1
    const data = mock.pixelData

    data[0] = 200; data[1] = 200; data[2] = 200; data[3] = 255
    data[4] = 50; data[5] = 50; data[6] = 50; data[7] = 255

    binarize(mock.canvas as unknown as HTMLCanvasElement, 128, true)

    expect(data[0]).toBe(0)   // bright → white → inverted → black
    expect(data[4]).toBe(255) // dark → black → inverted → white
  })

  it('preserves alpha channel', () => {
    const mock = createMockCanvas()
    mock.canvas.width = 1
    mock.canvas.height = 1
    const data = mock.pixelData

    data[0] = 200; data[1] = 200; data[2] = 200; data[3] = 128

    binarize(mock.canvas as unknown as HTMLCanvasElement, 128, false)

    expect(data[3]).toBe(128)
  })
})
