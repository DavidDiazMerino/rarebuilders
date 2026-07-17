import { describe, expect, it } from 'vitest'
import { initialAppData, loadAppData, saveAppData, STORAGE_KEY } from './storage'

describe('local application storage', () => {
  it('round-trips validated application data', () => {
    const data = { ...initialAppData(), mode: 'demo' as const }
    saveAppData(data)

    const restored = loadAppData()
    expect(restored.mode).toBe('demo')
    expect(restored.profile.name).toBe('David')
    expect(restored.opportunities.length).toBeGreaterThanOrEqual(5)
  })

  it('recovers safely from invalid or incompatible data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"version":99,"profile":null}')

    const restored = loadAppData()
    expect(restored.version).toBe(1)
    expect(restored.mode).toBeNull()
    expect(restored.profile.name).toBe('David')
  })
})
