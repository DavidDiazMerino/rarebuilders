import { afterEach, describe, expect, it, vi } from 'vitest'
import { estimateIssueSaturation, listPublicRepositories, searchOpportunityIssues } from './github'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GitHub public connector', () => {
  it('measures claims and linked pull requests without calling them competitors', () => {
    const result = estimateIssueSaturation(
      'Bounty available.',
      1_000,
      [{ body: "I'm working on this" }, { body: '/assign me' }],
      [
        { event: 'cross-referenced', subject: { type: 'PullRequest', state: 'open' } },
        { event: 'cross-referenced', subject: { type: 'PullRequest', state: 'closed', mergedAt: '2026-08-30T10:00:00Z' } },
      ],
    )
    expect(result).toMatchObject({ comments: 1_000, claims: 2, openPullRequests: 1, mergedPullRequests: 1 })
    expect(result).not.toHaveProperty('competitors')
  })

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
