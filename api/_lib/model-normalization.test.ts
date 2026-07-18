import { describe, expect, it } from 'vitest'
import { normalizeHundredScore } from './model-normalization'

describe('model score normalization', () => {
  it('converts fractional model scores to the product 0–100 scale', () => {
    expect(normalizeHundredScore(0.99)).toBe(99)
    expect(normalizeHundredScore(0.58)).toBe(58)
  })

  it('keeps and rounds scores already expressed on the 0–100 scale', () => {
    expect(normalizeHundredScore(84)).toBe(84)
    expect(normalizeHundredScore(66.4)).toBe(66)
    expect(normalizeHundredScore(0)).toBe(0)
  })
})
