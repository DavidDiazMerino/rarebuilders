import { describe, expect, it } from 'vitest'
import { hasSourceAdapter, registerSourceAdapter, sourceCapabilities } from './source-registry'

describe('source adapter registry', () => {
  it('reports built-in catalogue and monitor capabilities', () => {
    const ids = sourceCapabilities().map((item) => item.id)
    expect(ids).toContain('github')
    expect(ids).toContain('page-monitor')
  })

  it('accepts a runtime adapter without changing domain enums', () => {
    registerSourceAdapter('test-runtime', {
      capability: () => ({
        id: 'test-runtime', label: 'Test runtime', group: 'monitor', collectorKinds: ['page'],
        configured: true, costClass: 'free', privacy: 'public', experimental: true,
      }),
    })
    expect(hasSourceAdapter('test-runtime')).toBe(true)
    expect(sourceCapabilities().find((item) => item.id === 'test-runtime')?.experimental).toBe(true)
  })
})
