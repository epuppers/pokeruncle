import { describe, it, expect } from 'vitest'
import { GGPOKER_PRESET, FULL_IMAGE_PRESET } from './presets'
import type { PreprocessConfig } from './preprocessing.types'

function validatePreset(preset: PreprocessConfig) {
  if (preset.region) {
    expect(preset.region.x).toBeGreaterThanOrEqual(0)
    expect(preset.region.x).toBeLessThanOrEqual(1)
    expect(preset.region.y).toBeGreaterThanOrEqual(0)
    expect(preset.region.y).toBeLessThanOrEqual(1)
    expect(preset.region.width).toBeGreaterThan(0)
    expect(preset.region.height).toBeGreaterThan(0)
    expect(preset.region.x + preset.region.width).toBeLessThanOrEqual(1)
    expect(preset.region.y + preset.region.height).toBeLessThanOrEqual(1)
  }
  expect(preset.threshold).toBeGreaterThanOrEqual(0)
  expect(preset.threshold).toBeLessThanOrEqual(255)
  expect(preset.scale).toBeGreaterThanOrEqual(1)
}

describe('presets', () => {
  it('GGPOKER_PRESET has valid values', () => {
    validatePreset(GGPOKER_PRESET)
    expect(GGPOKER_PRESET.region).not.toBeNull()
    expect(GGPOKER_PRESET.invert).toBe(true) // light text on dark background
    expect(GGPOKER_PRESET.scale).toBeGreaterThan(1) // upscaling enabled
  })

  it('FULL_IMAGE_PRESET has no region crop', () => {
    validatePreset(FULL_IMAGE_PRESET)
    expect(FULL_IMAGE_PRESET.region).toBeNull()
    expect(FULL_IMAGE_PRESET.invert).toBe(false)
    expect(FULL_IMAGE_PRESET.scale).toBe(1)
  })
})
