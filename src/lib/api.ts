import type {
  ApiFailure,
  ApiSuccess,
  BuilderProfile,
  Opportunity,
  OpportunityAnalysis,
  ProfileSummary,
  Strategy,
} from '../../shared/domain'

async function request<T>(url: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = await response.json() as ApiSuccess<T> | ApiFailure
  if (!response.ok || 'error' in payload) {
    const message = 'error' in payload ? payload.error.message : 'The request failed.'
    throw new Error(message)
  }
  return payload
}

export type NoteInput = { name: string; content: string }
export type GithubProjectInput = {
  name: string
  url: string
  description: string
  languages: string[]
  topics: string[]
  readme: string
}

export type GithubRepository = {
  id: number
  name: string
  fullName: string
  description: string
  url: string
  language: string | null
  topics: string[]
  updatedAt: string
  fork: boolean
}

export type GithubOpportunityCandidate = {
  id: number
  title: string
  body: string
  url: string
  repository: string
  labels: string[]
  comments: number
  createdAt: string
  updatedAt: string
}

export const api = {
  summarizeProfile: (input: { notes: NoteInput[]; repositories: GithubProjectInput[] }) =>
    request<ProfileSummary>('/api/profile/summarize', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  fetchSource: (url: string) =>
    request<{ url: string; title: string; text: string }>('/api/source/fetch', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  analyzeOpportunity: (input: { sourceUrl: string; sourceText: string; profile: BuilderProfile }) =>
    request<OpportunityAnalysis>('/api/opportunities/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  generateStrategy: (input: { opportunity: Opportunity; profile: BuilderProfile }) =>
    request<Strategy>('/api/strategies/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  githubRepositories: (username: string) =>
    request<GithubRepository[]>(`/api/github/repositories?username=${encodeURIComponent(username)}`),
  githubRepositoryContext: (owner: string, repo: string) =>
    request<GithubProjectInput>(`/api/github/repository-context?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`),
  githubOpportunities: (query: string) =>
    request<GithubOpportunityCandidate[]>(`/api/github/opportunities?q=${encodeURIComponent(query)}`),
}
