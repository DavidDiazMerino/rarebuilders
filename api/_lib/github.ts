import { getCached, setCached } from './redis.js'
import { contentHash } from './cache.js'

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'RareBuilders-Hackathon',
}

if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers })
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error('GitHub’s public API limit is temporarily exhausted. Try again after the reset.')
    }
    if (response.status === 404) throw new Error('The GitHub user or repository was not found.')
    throw new Error(`GitHub returned ${response.status}.`)
  }
  return response.json() as Promise<T>
}

type GithubRepoResponse = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  topics: string[]
  updated_at: string
  fork: boolean
}

export async function listPublicRepositories(username: string) {
  const cacheKey = `rarebuilders:github:user:${username.toLowerCase()}`
  const cached = await getCached<ReturnType<typeof mapRepositories>>(cacheKey)
  if (cached) return { data: cached, cached: true }
  const repos = await githubFetch<GithubRepoResponse[]>(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=30`,
  )
  const data = mapRepositories(repos)
  await setCached(cacheKey, data, 60 * 30)
  return { data, cached: false }
}

function mapRepositories(repos: GithubRepoResponse[]) {
  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description ?? '',
    url: repo.html_url,
    language: repo.language,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
    fork: repo.fork,
  }))
}

type ReadmeResponse = { content: string; encoding: string }
type RepoDetailResponse = GithubRepoResponse & { languages_url: string }

export async function getRepositoryContext(owner: string, repo: string) {
  const cacheKey = `rarebuilders:github:context:${owner.toLowerCase()}:${repo.toLowerCase()}`
  const cached = await getCached<{
    name: string
    url: string
    description: string
    languages: string[]
    topics: string[]
    readme: string
  }>(cacheKey)
  if (cached) return { data: cached, cached: true }

  const [detail, readme, languages] = await Promise.all([
    githubFetch<RepoDetailResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`),
    githubFetch<ReadmeResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`).catch(() => null),
    githubFetch<Record<string, number>>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`).catch(() => ({})),
  ])
  const readmeText = readme?.encoding === 'base64'
    ? Buffer.from(readme.content.replace(/\n/g, ''), 'base64').toString('utf8').slice(0, 12_000)
    : ''
  const data = {
    name: detail.name,
    url: detail.html_url,
    description: detail.description ?? '',
    languages: Object.keys(languages),
    topics: detail.topics ?? [],
    readme: readmeText,
  }
  await setCached(cacheKey, data, 60 * 60 * 6)
  return { data, cached: false }
}

type IssueSearchResponse = {
  items: Array<{
    id: number
    title: string
    body: string | null
    html_url: string
    repository_url: string
    labels: Array<{ name: string }>
    comments: number
    created_at: string
    updated_at: string
    pull_request?: unknown
  }>
}

export async function searchOpportunityIssues(query: string) {
  const normalized = query.includes('is:issue') ? query : `is:issue ${query}`
  const openQuery = normalized.includes('is:open') || normalized.includes('is:closed')
    ? normalized
    : `is:open ${normalized}`
  const cacheKey = `rarebuilders:github:search:${contentHash(openQuery)}`
  const cached = await getCached<Awaited<ReturnType<typeof performIssueSearch>>>(cacheKey)
  if (cached) return { data: cached, cached: true }
  const data = await performIssueSearch(openQuery)
  await setCached(cacheKey, data, 60 * 10)
  return { data, cached: false }
}

async function performIssueSearch(query: string) {
  const response = await githubFetch<IssueSearchResponse>(
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`,
  )
  return response.items
    .filter((item) => !item.pull_request)
    .map((item) => ({
      id: item.id,
      title: item.title,
      body: (item.body ?? '').slice(0, 8_000),
      url: item.html_url,
      repository: item.repository_url.replace('https://api.github.com/repos/', ''),
      labels: item.labels.map((label) => label.name),
      comments: item.comments,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
}
