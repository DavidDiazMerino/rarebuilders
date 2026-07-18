import { afterEach, describe, expect, it, vi } from 'vitest'
import { listPublicRepositories, searchOpportunityIssues } from './github'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GitHub public connector', () => {
  it('normalizes public repositories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        id: 42,
        name: 'rare-tool',
        full_name: 'builder/rare-tool',
        description: 'A useful prototype',
        html_url: 'https://github.com/builder/rare-tool',
        language: 'TypeScript',
        topics: ['agents'],
        updated_at: '2026-07-17T10:00:00Z',
        fork: false,
      },
    ]), { status: 200 })))

    const result = await listPublicRepositories('builder')

    expect(result.cached).toBe(false)
    expect(result.data[0]).toMatchObject({
      fullName: 'builder/rare-tool',
      language: 'TypeScript',
      topics: ['agents'],
    })
  })

  it('returns issues and removes pull requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [
        {
          id: 1,
          title: 'Open bounty',
          body: 'Build the missing connector.',
          html_url: 'https://github.com/acme/project/issues/1',
          repository_url: 'https://api.github.com/repos/acme/project',
          labels: [{ name: 'bounty' }],
          comments: 3,
          created_at: '2026-07-10T10:00:00Z',
          updated_at: '2026-07-17T10:00:00Z',
        },
        {
          id: 2,
          title: 'A pull request',
          body: '',
          html_url: 'https://github.com/acme/project/pull/2',
          repository_url: 'https://api.github.com/repos/acme/project',
          labels: [],
          comments: 0,
          created_at: '2026-07-10T10:00:00Z',
          updated_at: '2026-07-17T10:00:00Z',
          pull_request: {},
        },
      ],
    }), { status: 200 })))

    const result = await searchOpportunityIssues('label:bounty')

    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      title: 'Open bounty',
      repository: 'acme/project',
      labels: ['bounty'],
    })
  })
})
