import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchConnector, searchDevpost, searchEuFunding, searchKaggle } from './connectors'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('opportunity connectors', () => {
  it('normalizes Devpost hackathons into shared candidates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      hackathons: [{
        id: 30223,
        title: 'OpenAI Build Week',
        url: 'https://openai.devpost.com/',
        organization_name: 'OpenAI',
        displayed_location: { location: 'Online' },
        submission_period_dates: 'Jun 13 - Jul 21, 2026',
        time_left_to_submission: '4 days left',
        themes: [{ name: 'Machine Learning/AI' }],
        prize_amount: '$<span data-currency-value>100,000</span>',
        registrations_count: 33308,
        invite_only: false,
      }],
    }), { status: 200 })))

    const candidates = await searchDevpost('AI')

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      connector: 'devpost',
      title: 'OpenAI Build Week',
      organizer: 'OpenAI',
      reward: '$100,000',
      deadline: '2026-07-21T23:59:59.000Z',
      status: 'new',
    })
  })

  it('drops Devpost challenges that have already ended', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      hackathons: [{
        id: 1,
        title: 'Old challenge',
        url: 'https://old.devpost.com/',
        organization_name: 'Example',
        displayed_location: { location: 'Online' },
        submission_period_dates: 'May 1 - Jun 15, 2026',
        time_left_to_submission: 'Ended',
        themes: [],
        prize_amount: '$1,000',
        registrations_count: 10,
        invite_only: false,
      }],
    }), { status: 200 })))

    await expect(searchDevpost('AI')).resolves.toEqual([])
  })

  it('filters EU search noise and keeps funding topics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [
        {
          reference: 'FAQ-1',
          url: 'https://example.eu/faq',
          summary: 'A FAQ',
          content: 'Question',
          language: 'en',
          database: 'SEDIA_FAQ',
          metadata: { type: ['2'] },
        },
        {
          reference: 'HORIZON-AI-1',
          url: 'https://example.eu/topic',
          summary: 'Creative AI for European media',
          content: 'Companies and consortium partners can apply.',
          language: 'en',
          database: 'SEDIA',
          metadata: {
            type: ['1'],
            keywords: ['AI', 'media'],
            deadlineDate: ['2026-09-01T17:00:00Z'],
            descriptionByte: ['Companies and consortium partners can apply.'],
          },
        },
      ],
    }), { status: 200 })))

    const candidates = await searchEuFunding('creative AI')

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      connector: 'eu',
      externalId: 'HORIZON-AI-1',
      participationModes: expect.arrayContaining(['company', 'consortium']),
    })
  })

  it('reports an unconfigured Kaggle connector without failing the aggregate', async () => {
    const previousToken = process.env.KAGGLE_API_TOKEN
    const previousUsername = process.env.KAGGLE_USERNAME
    const previousKey = process.env.KAGGLE_KEY
    delete process.env.KAGGLE_API_TOKEN
    delete process.env.KAGGLE_USERNAME
    delete process.env.KAGGLE_KEY

    const result = await searchConnector('kaggle', '')

    expect(result.configured).toBe(false)
    expect(result.candidates).toEqual([])
    expect(result.error).toMatch(/credentials/i)
    if (previousToken) process.env.KAGGLE_API_TOKEN = previousToken
    if (previousUsername) process.env.KAGGLE_USERNAME = previousUsername
    if (previousKey) process.env.KAGGLE_KEY = previousKey
  })

  it('normalizes configured Kaggle competitions with the current API token', async () => {
    const previousToken = process.env.KAGGLE_API_TOKEN
    const previousUsername = process.env.KAGGLE_USERNAME
    const previousKey = process.env.KAGGLE_KEY
    process.env.KAGGLE_API_TOKEN = 'current-token'
    delete process.env.KAGGLE_USERNAME
    delete process.env.KAGGLE_KEY
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      ref: 'useful-ai',
      title: 'Useful AI challenge',
      description: 'Build a useful model.',
      deadline: '2026-10-01T00:00:00Z',
      reward: '$10,000',
      organizationName: 'Example Lab',
      tags: [{ name: 'AI' }],
      teamCount: 120,
    }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const candidates = await searchKaggle('useful')

    expect(candidates[0]).toMatchObject({
      connector: 'kaggle',
      externalId: 'useful-ai',
      organizer: 'Example Lab',
      participationModes: ['individual', 'team'],
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer current-token',
        }),
      }),
    )
    if (previousToken) process.env.KAGGLE_API_TOKEN = previousToken
    else delete process.env.KAGGLE_API_TOKEN
    if (previousUsername) process.env.KAGGLE_USERNAME = previousUsername
    else delete process.env.KAGGLE_USERNAME
    if (previousKey) process.env.KAGGLE_KEY = previousKey
    else delete process.env.KAGGLE_KEY
  })

  it('keeps legacy Kaggle username and key compatibility', async () => {
    const previousToken = process.env.KAGGLE_API_TOKEN
    const previousUsername = process.env.KAGGLE_USERNAME
    const previousKey = process.env.KAGGLE_KEY
    delete process.env.KAGGLE_API_TOKEN
    process.env.KAGGLE_USERNAME = 'builder'
    process.env.KAGGLE_KEY = 'legacy-secret'
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await searchKaggle('')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('builder:legacy-secret').toString('base64')}`,
        }),
      }),
    )
    if (previousToken) process.env.KAGGLE_API_TOKEN = previousToken
    if (previousUsername) process.env.KAGGLE_USERNAME = previousUsername
    else delete process.env.KAGGLE_USERNAME
    if (previousKey) process.env.KAGGLE_KEY = previousKey
    else delete process.env.KAGGLE_KEY
  })
})
