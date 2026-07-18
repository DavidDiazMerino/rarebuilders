import {
  AlertTriangle,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  GitFork,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  BuilderProfile,
  CareerProfile,
  ParticipationMode,
  ProfileSummary,
  ProjectAsset,
  RewardPreference,
  TeamMode,
} from '../../shared/domain'
import { PageHeader } from '../components/PageHeader'
import { api, type GithubRepository, type NoteInput } from '../lib/api'
import { useAppState } from '../state/AppState'

const domainOptions = [
  'ai', 'ai-agents', 'developer-tools', 'creative-tech', 'publishing', 'communities',
  'education', 'music', 'hardware', 'biotech', 'civic-tech', 'climate',
]
const rewardOptions: Array<{ value: RewardPreference; label: string }> = [
  { value: 'money', label: 'Money' },
  { value: 'visibility', label: 'Visibility' },
  { value: 'access', label: 'Access' },
  { value: 'learning', label: 'Learning' },
  { value: 'portfolio', label: 'Portfolio' },
]

type NoteDraft = NoteInput & { selected: boolean }
type MemoryDraft = {
  summary: ProfileSummary
  repositories: GithubRepository[]
}

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  const chunkSize = 32_768
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return window.btoa(binary)
}

function ToggleList({
  values,
  selected,
  onChange,
}: {
  values: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }
  return (
    <div className="choice-grid">
      {values.map((value) => (
        <button
          type="button"
          key={value}
          className={selected.includes(value) ? 'choice-chip selected' : 'choice-chip'}
          onClick={() => toggle(value)}
        >
          {selected.includes(value) ? <Check size={14} /> : <Plus size={14} />}
          {value.replaceAll('-', ' ')}
        </button>
      ))}
    </div>
  )
}

function Onboarding({
  profile,
  onSave,
}: {
  profile: BuilderProfile
  onSave: (profile: BuilderProfile) => void
}) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(profile)

  const finish = () => {
    onSave({ ...draft, onboardingComplete: true })
  }

  return (
    <section className="onboarding-card">
      <div className="onboarding-progress">
        <span className={step === 1 ? 'active' : ''}>01 · Direction</span>
        <i />
        <span className={step === 2 ? 'active' : ''}>02 · Constraints</span>
      </div>
      {step === 1 ? (
        <>
          <p className="section-kicker">Decision 01 of 06 · Direction</p>
          <h2>Where do you already have an edge?</h2>
          <p>Pick your obvious lanes, then the domains you would accept as a deliberate wildcard.</p>
          <label className="field-block">
            <span>Core interests</span>
            <ToggleList values={domainOptions} selected={draft.domains} onChange={(domains) => setDraft({ ...draft, domains })} />
          </label>
          <label className="field-block">
            <span>Wildcard territory</span>
            <ToggleList values={domainOptions} selected={draft.wildcardDomains} onChange={(wildcardDomains) => setDraft({ ...draft, wildcardDomains })} />
          </label>
          <label className="field-block">
            <span>Hard no-go areas</span>
            <ToggleList values={domainOptions} selected={draft.noGoDomains} onChange={(noGoDomains) => setDraft({ ...draft, noGoDomains })} />
          </label>
          <button className="button primary onboarding-next" onClick={() => setStep(2)}>
            Set constraints <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <>
          <p className="section-kicker">Reality check</p>
          <h2>What makes an opportunity worth it?</h2>
          <div className="constraint-grid">
            <label>
              <span>02 · Hours available this week</span>
              <input
                type="range"
                min="4"
                max="40"
                value={draft.weeklyHours}
                onChange={(event) => setDraft({ ...draft, weeklyHours: Number(event.target.value) })}
              />
              <strong>{draft.weeklyHours} hours</strong>
            </label>
            <label>
              <span>03 · Primary reward</span>
              <select
                value={draft.rewardPreference}
                onChange={(event) => setDraft({ ...draft, rewardPreference: event.target.value as RewardPreference })}
              >
                {rewardOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>04 · How you compete</span>
              <select
                value={draft.teamMode}
                onChange={(event) => setDraft({ ...draft, teamMode: event.target.value as TeamMode })}
              >
                <option value="solo">Solo</option>
                <option value="team">With a team</option>
                <option value="either">Either</option>
              </select>
            </label>
            <label>
              <span>Participation paths you would consider</span>
              <ToggleList
                values={['individual', 'team', 'company', 'consortium']}
                selected={draft.participationModes}
                onChange={(participationModes) => {
                  if (participationModes.length) {
                    setDraft({
                      ...draft,
                      participationModes: participationModes as ParticipationMode[],
                    })
                  }
                }}
              />
            </label>
            <label>
              <span>05 · Comfortable regions</span>
              <ToggleList
                values={['global', 'europe', 'latam', 'north-america', 'asia']}
                selected={draft.regions}
                onChange={(regions) => setDraft({ ...draft, regions })}
              />
            </label>
            <label>
              <span>06 · Working languages</span>
              <ToggleList
                values={['English', 'Spanish', 'Portuguese', 'French']}
                selected={draft.languages}
                onChange={(languages) => setDraft({ ...draft, languages })}
              />
            </label>
          </div>
          <div className="onboarding-actions">
            <button className="button secondary" onClick={() => setStep(1)}>Back</button>
            <button className="button primary" onClick={finish}>Build my radar <Sparkles size={16} /></button>
          </div>
        </>
      )}
    </section>
  )
}

export function ProfilePage() {
  const {
    data,
    updateProfile,
    updateCareer,
    updateSettings,
    importBuilderMemory,
    resetLearning,
  } = useAppState()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState<NoteDraft[]>([])
  const [githubUser, setGithubUser] = useState(
    () => data.profile.connectedGithubRepositories[0]?.fullName.split('/')[0] ?? '',
  )
  const [repositories, setRepositories] = useState<GithubRepository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvDraft, setCvDraft] = useState<CareerProfile | null>(null)
  const [analyzingCv, setAnalyzingCv] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ownerCode, setOwnerCode] = useState('')
  const [ownerActive, setOwnerActive] = useState(false)

  const selectedNotes = useMemo(() => notes.filter((note) => note.selected), [notes])
  const connectedRepositoryNames = useMemo(
    () => new Set(data.profile.connectedGithubRepositories.map((repository) => repository.fullName.toLowerCase())),
    [data.profile.connectedGithubRepositories],
  )
  const selectedRepositoryRecords = useMemo(
    () => repositories.filter((repository) => selectedRepos.includes(repository.fullName)),
    [repositories, selectedRepos],
  )
  const confirmedCharacters = selectedNotes.reduce((total, note) => total + note.content.length, 0)

  useEffect(() => {
    if (!window.sessionStorage.getItem('rarebuilders:owner-code')) return
    void api.capabilities().then((result) => setOwnerActive(result.data.owner)).catch(() => setOwnerActive(false))
  }, [])

  const activateOwner = async () => {
    window.sessionStorage.setItem('rarebuilders:owner-code', ownerCode)
    try {
      const result = await api.capabilities()
      setOwnerActive(result.data.owner)
      if (!result.data.owner) {
        window.sessionStorage.removeItem('rarebuilders:owner-code')
        setError('That personal access code is not valid.')
      } else {
        setOwnerCode('')
        setSuccess('Personal analysis budget enabled for this browser session.')
      }
    } catch {
      window.sessionStorage.removeItem('rarebuilders:owner-code')
      setError('Personal access could not be verified.')
    }
  }

  const analyzeCv = async () => {
    if (!cvFile) return
    if (cvFile.size > 2_000_000) {
      setError('The CV exceeds the 2 MB import limit.')
      return
    }
    setAnalyzingCv(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.analyzeCareer({
        filename: cvFile.name,
        mimeType: cvFile.type || 'text/plain',
        base64: await fileToBase64(cvFile),
      })
      setCvDraft(result.data)
      setCvFile(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CV analysis failed.')
    } finally {
      setAnalyzingCv(false)
    }
  }

  const applyCv = () => {
    if (!cvDraft) return
    updateCareer(cvDraft)
    setCvDraft(null)
    setSuccess('Professional profile updated. The original CV was not stored.')
  }

  const readNotes = async (files: FileList | null) => {
    if (!files) return
    setError('')
    const accepted = [...files]
      .filter((file) => file.name.endsWith('.md') || file.name.endsWith('.txt'))
      .slice(0, 12)
    const loaded = await Promise.all(accepted.map(async (file) => ({
      name: file.name,
      content: (await file.text()).slice(0, 15_000),
      selected: true,
    })))
    const total = loaded.reduce((sum, note) => sum + note.content.length, 0)
    if (total > 60_000) {
      let remaining = 60_000
      setNotes(loaded.map((note) => {
        const content = note.content.slice(0, Math.max(0, remaining))
        remaining -= content.length
        return { ...note, content, selected: content.length > 0 }
      }))
      setError('The selection was trimmed to the 60,000-character privacy and cost limit.')
    } else {
      setNotes(loaded)
    }
  }

  const loadGithub = async () => {
    if (!githubUser.trim()) return
    setLoadingGithub(true)
    setError('')
    try {
      const result = await api.githubRepositories(githubUser.trim())
      setRepositories(result.data)
      setSelectedRepos(result.data
        .filter((repo) => !repo.fork && !connectedRepositoryNames.has(repo.fullName.toLowerCase()))
        .slice(0, 4)
        .map((repo) => repo.fullName))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load GitHub projects.')
    } finally {
      setLoadingGithub(false)
    }
  }

  const toggleRepo = (fullName: string) => {
    setSelectedRepos((current) => {
      if (current.includes(fullName)) return current.filter((item) => item !== fullName)
      if (current.length >= 8) return current
      return [...current, fullName]
    })
  }

  const summarize = async () => {
    if (!selectedNotes.length && !selectedRepos.length) {
      setError('Select at least one note or public repository.')
      return
    }
    setSummarizing(true)
    setError('')
    setSuccess('')
    try {
      const repoContexts = await Promise.all(selectedRepos.map((fullName) => {
        const [owner, repo] = fullName.split('/')
        return api.githubRepositoryContext(owner, repo).then((result) => result.data)
      }))
      const result = await api.summarizeProfile({
        notes: selectedNotes.map(({ name, content }) => ({ name, content })),
        repositories: repoContexts,
      })
      setMemoryDraft({
        summary: result.data,
        repositories: selectedRepositoryRecords,
      })
      setSuccess('Builder-memory analysis is ready. Review every extracted signal before applying it.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Builder memory analysis failed.')
    } finally {
      setSummarizing(false)
    }
  }

  const applyMemoryDraft = () => {
    if (!memoryDraft) return
    const projects: ProjectAsset[] = memoryDraft.summary.projects.map((project) => ({
      ...project,
      id: project.id ?? crypto.randomUUID(),
    }))
    const importedAt = new Date().toISOString()
    importBuilderMemory({
      projects,
      fastSkills: memoryDraft.summary.fastSkills,
      domains: memoryDraft.summary.domains,
      wildcardDomains: memoryDraft.summary.wildcardDomains,
      noGoDomains: memoryDraft.summary.noGoDomains,
      technologies: memoryDraft.summary.technologies,
      repositories: memoryDraft.repositories.map((repository) => ({
        fullName: repository.fullName,
        url: repository.url,
        description: repository.description,
        language: repository.language,
        importedAt,
      })),
    })
    setSelectedRepos([])
    setNotes((current) => current.map((note) => ({ ...note, selected: false })))
    const repositoryResult = memoryDraft.repositories.length
      ? ` ${memoryDraft.repositories.length} GitHub repo${memoryDraft.repositories.length === 1 ? '' : 's'} connected.`
      : ''
    const preferenceResult = memoryDraft.summary.noGoDomains.length || memoryDraft.summary.wildcardDomains.length
      ? ` ${memoryDraft.summary.wildcardDomains.length} exploratory and ${memoryDraft.summary.noGoDomains.length} no-go signals applied.`
      : ''
    setSuccess(`${projects.length} project${projects.length === 1 ? '' : 's'} added to builder memory.${repositoryResult}${preferenceResult}`)
    setMemoryDraft(null)
  }

  const removeMemorySignal = (
    field: 'domains' | 'wildcardDomains' | 'noGoDomains' | 'fastSkills' | 'technologies',
    value: string,
  ) => {
    setMemoryDraft((current) => current
      ? {
          ...current,
          summary: {
            ...current.summary,
            [field]: current.summary[field].filter((item) => item !== value),
          },
        }
      : current)
  }

  if (!data.profile.onboardingComplete || editing) {
    return (
      <div className="page narrow-page">
        <PageHeader
          eyebrow="Builder profile"
          title="Give the radar enough signal to disagree with you."
          description="Six decisions create the first model. Notes and GitHub can deepen it afterwards."
        />
        <Onboarding
          profile={data.profile}
          onSave={(profile) => {
            updateProfile(profile)
            setEditing(false)
            navigate('/radar')
          }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Builder memory"
        title={`What RareBuilders knows about ${data.profile.name}.`}
        description="Recommendations improve when the system can see reusable products, audiences, skills and unfinished ideas—not just selected interests."
        actions={<button className="button secondary" onClick={() => setEditing(true)}>Edit six decisions</button>}
      />

      <section className="profile-overview">
        <div>
          <span>Core domains</span>
          <div className="tag-row">{data.profile.domains.map((item) => <em key={item}>{item}</em>)}</div>
        </div>
        <div>
          <span>Wildcard territory</span>
          <div className="tag-row">{data.profile.wildcardDomains.map((item) => <em key={item}>{item}</em>)}</div>
        </div>
        <div>
          <span>No-go signals</span>
          <div className="tag-row">
            {data.profile.noGoDomains.length
              ? data.profile.noGoDomains.map((item) => <em key={item}>{item}</em>)
              : <small>None declared</small>}
          </div>
        </div>
        <div>
          <span>Weekly constraint</span>
          <strong>{data.profile.weeklyHours}h · {data.profile.teamMode} · {data.profile.rewardPreference}</strong>
        </div>
        <div>
          <span>Participation paths</span>
          <strong>{data.profile.participationModes.join(' · ')}</strong>
        </div>
      </section>

      <section className="personal-access">
        <div>
          <KeyRound size={18} />
          <span>
            <strong>{ownerActive ? 'Personal analysis enabled' : 'Personal analysis budget'}</strong>
            <small>{ownerActive
              ? 'Higher private quota is active only for this browser session.'
              : 'Public visitors keep the conservative shared limit.'}</small>
          </span>
        </div>
        {ownerActive ? (
          <label>
            <span>Automatic daily analyses</span>
            <select
              value={data.settings.autoAnalysisBudget}
              onChange={(event) => updateSettings({
                ...data.settings,
                autoAnalysisBudget: Number(event.target.value) as 0 | 2 | 5,
              })}
            >
              <option value="0">0 · manual only</option>
              <option value="2">2 · balanced</option>
              <option value="5">5 · full daily radar</option>
            </select>
          </label>
        ) : (
          <div className="personal-access-form">
            <input
              type="password"
              value={ownerCode}
              onChange={(event) => setOwnerCode(event.target.value)}
              placeholder="Personal access code"
            />
            <button className="button secondary" disabled={!ownerCode} onClick={() => void activateOwner()}>Enable</button>
          </div>
        )}
      </section>

      <div className="profile-layout">
        <section className="memory-import">
          <div className="section-heading">
            <div><p className="section-kicker">Import context</p><h2>Use the work you already documented.</h2></div>
          </div>
          <p className="muted-copy">Nothing is sent until you review the exact notes and repositories below.</p>

          <div className="import-source">
            <div className="import-source-heading">
              <span className="source-icon"><BriefcaseBusiness size={19} /></span>
              <div>
                <strong>Professional CV</strong>
                <small>PDF, DOCX, text or Markdown · 2 MB maximum · never stored</small>
              </div>
              <label className="button secondary file-button">
                <Upload size={15} /> Select CV
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  onChange={(event) => {
                    setCvFile(event.target.files?.[0] ?? null)
                    setCvDraft(null)
                  }}
                />
              </label>
            </div>
            {cvFile ? (
              <div className="cv-file-ready">
                <span><FileText size={16} /><strong>{cvFile.name}</strong><small>{Math.ceil(cvFile.size / 1024)} KB</small></span>
                <button className="button primary" onClick={() => void analyzeCv()} disabled={analyzingCv}>
                  {analyzingCv ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
                  {analyzingCv ? 'Reading CV…' : 'Extract professional profile'}
                </button>
              </div>
            ) : null}
            {cvDraft ? (
              <div className="cv-review">
                <div className="cv-review-heading">
                  <div><p className="section-kicker">Review before applying</p><h3>Only supported claims should stay.</h3></div>
                  <button className="icon-button" title="Discard extraction" onClick={() => setCvDraft(null)}><X size={15} /></button>
                </div>
                <label>
                  <span>Headline</span>
                  <input value={cvDraft.headline} onChange={(event) => setCvDraft({ ...cvDraft, headline: event.target.value })} />
                </label>
                <label>
                  <span>Professional summary</span>
                  <textarea value={cvDraft.summary} onChange={(event) => setCvDraft({ ...cvDraft, summary: event.target.value })} />
                </label>
                <div className="cv-review-section">
                  <strong>Skills with evidence</strong>
                  {cvDraft.skills.map((skill, index) => (
                    <div className="cv-edit-row" key={`${skill.name}-${index}`}>
                      <input
                        value={skill.name}
                        onChange={(event) => setCvDraft({
                          ...cvDraft,
                          skills: cvDraft.skills.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item),
                        })}
                      />
                      <small>{skill.evidence.join(' · ') || 'No explicit evidence'}</small>
                      <button title="Remove skill" onClick={() => setCvDraft({
                        ...cvDraft,
                        skills: cvDraft.skills.filter((_, itemIndex) => itemIndex !== index),
                      })}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="cv-review-section">
                  <strong>Experience</strong>
                  {cvDraft.experiences.map((experience, index) => (
                    <div className="cv-experience-edit" key={experience.id}>
                      <input
                        value={experience.role}
                        aria-label={`Experience ${index + 1} role`}
                        onChange={(event) => setCvDraft({
                          ...cvDraft,
                          experiences: cvDraft.experiences.map((item) =>
                            item.id === experience.id ? { ...item, role: event.target.value } : item),
                        })}
                      />
                      <input
                        value={experience.organization}
                        aria-label={`Experience ${index + 1} organization`}
                        onChange={(event) => setCvDraft({
                          ...cvDraft,
                          experiences: cvDraft.experiences.map((item) =>
                            item.id === experience.id ? { ...item, organization: event.target.value } : item),
                        })}
                      />
                      <textarea
                        value={experience.summary}
                        aria-label={`Experience ${index + 1} summary`}
                        onChange={(event) => setCvDraft({
                          ...cvDraft,
                          experiences: cvDraft.experiences.map((item) =>
                            item.id === experience.id ? { ...item, summary: event.target.value } : item),
                        })}
                      />
                      <button title="Remove experience" onClick={() => setCvDraft({
                        ...cvDraft,
                        experiences: cvDraft.experiences.filter((item) => item.id !== experience.id),
                      })}><Trash2 size={14} /> Remove</button>
                    </div>
                  ))}
                </div>
                <div className="cv-review-actions">
                  <span><LockKeyhole size={15} /> Raw file discarded after this analysis</span>
                  <button className="button primary" onClick={applyCv}>Apply professional profile <Check size={16} /></button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="import-source">
            <div className="import-source-heading">
              <span className="source-icon"><FileText size={19} /></span>
              <div><strong>Obsidian or notes</strong><small>Select up to 12 Markdown or text files.</small></div>
              <label className="button secondary file-button">
                Select files
                <input type="file" accept=".md,.txt,text/markdown,text/plain" multiple onChange={(event) => void readNotes(event.target.files)} />
              </label>
            </div>
            {notes.length ? (
              <div className="source-preview-list">
                {notes.map((note, index) => (
                  <label key={`${note.name}-${index}`} className={note.selected ? 'source-preview selected' : 'source-preview'}>
                    <input
                      type="checkbox"
                      checked={note.selected}
                      onChange={() => setNotes((current) => current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, selected: !item.selected } : item,
                      ))}
                    />
                    <span><strong>{note.name}</strong><small>{note.content.slice(0, 110).replace(/\s+/g, ' ') || 'Empty file'}</small></span>
                    <em>{note.content.length.toLocaleString()} chars</em>
                  </label>
                ))}
                <div className="selection-total"><LockKeyhole size={15} /> {selectedNotes.length} confirmed · {confirmedCharacters.toLocaleString()} characters</div>
              </div>
            ) : null}
          </div>

          <div className="import-source">
            <div className="import-source-heading">
              <span className="source-icon"><GitFork size={19} /></span>
              <div><strong>Public GitHub</strong><small>No OAuth. Only repositories you select.</small></div>
            </div>
            {data.profile.connectedGithubRepositories.length ? (
              <div className="connected-repositories">
                <div className="connected-repositories-heading">
                  <span><Check size={14} /> In builder memory</span>
                  <em>{data.profile.connectedGithubRepositories.length} connected</em>
                </div>
                {data.profile.connectedGithubRepositories.map((repository) => (
                  <a
                    key={repository.fullName}
                    className="connected-repository"
                    href={repository.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="connected-repository-mark"><Check size={13} /></span>
                    <span>
                      <strong>{repository.fullName}</strong>
                      <small>{repository.description || 'Public repository added to your profile'}</small>
                    </span>
                    <em>
                      {repository.language ?? 'Mixed'}
                      <small>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(repository.importedAt))}</small>
                    </em>
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            ) : null}
            <div className="github-input">
              <input value={githubUser} onChange={(event) => setGithubUser(event.target.value)} placeholder="GitHub username" />
              <button className="button secondary" onClick={loadGithub} disabled={loadingGithub || !githubUser.trim()}>
                {loadingGithub ? <LoaderCircle className="spin" size={16} /> : <GitFork size={16} />}
                {repositories.length ? 'Refresh repos' : 'Load public repos'}
              </button>
            </div>
            {repositories.length ? (
              <div className="repo-picker">
                {repositories.map((repo) => {
                  const connected = connectedRepositoryNames.has(repo.fullName.toLowerCase())
                  const selected = selectedRepos.includes(repo.fullName)
                  return (
                    <button
                      key={repo.id}
                      className={selected ? 'repo-option selected' : 'repo-option'}
                      onClick={() => toggleRepo(repo.fullName)}
                    >
                      <span>{selected || connected ? <Check size={14} /> : <Plus size={14} />}</span>
                      <div>
                        <strong>{repo.name}</strong>
                        <small>{connected ? `Already in memory · ${repo.description || 'Select to refresh'}` : repo.description || 'No public description'}</small>
                      </div>
                      <em>{repo.language ?? 'Mixed'}</em>
                    </button>
                  )
                })}
                <div className="selection-total">
                  <GitFork size={15} /> {selectedRepos.length} selected · maximum 8
                </div>
              </div>
            ) : null}
          </div>

          {error ? <div className="inline-error"><AlertTriangle size={17} /> <span>{error}</span><button onClick={() => setError('')}><X size={15} /></button></div> : null}
          {success ? <div className="inline-success"><Check size={17} /> {success}</div> : null}
          {memoryDraft ? (
            <section className="memory-review">
              <div className="memory-review-heading">
                <div>
                  <p className="section-kicker">Review extracted profile signals</p>
                  <h3>Keep only what should influence your radar.</h3>
                </div>
                <button className="icon-button" title="Discard builder-memory analysis" onClick={() => setMemoryDraft(null)}>
                  <X size={15} />
                </button>
              </div>
              {([
                ['Core interests', 'domains'],
                ['Exploratory territory', 'wildcardDomains'],
                ['Explicit no-go topics', 'noGoDomains'],
                ['Documented skills', 'fastSkills'],
                ['Technologies', 'technologies'],
              ] as const).map(([label, field]) => (
                <div className="memory-signal-row" key={field}>
                  <span>{label}</span>
                  <div className="review-chip-list">
                    {memoryDraft.summary[field].length
                      ? memoryDraft.summary[field].map((value) => (
                          <button key={value} onClick={() => removeMemorySignal(field, value)}>
                            {value} <X size={11} />
                          </button>
                        ))
                      : <small>Nothing extracted</small>}
                  </div>
                </div>
              ))}
              <div className="memory-project-preview">
                <span>Reusable projects</span>
                {memoryDraft.summary.projects.length
                  ? memoryDraft.summary.projects.map((project) => (
                      <p key={project.name}><strong>{project.name}</strong><small>{project.summary}</small></p>
                    ))
                  : <small>No projects extracted from this selection.</small>}
              </div>
              {memoryDraft.summary.caveats.length ? (
                <div className="memory-caveats">
                  <strong>Extraction caveats</strong>
                  {memoryDraft.summary.caveats.map((caveat) => <span key={caveat}>{caveat}</span>)}
                </div>
              ) : null}
              <div className="memory-review-actions">
                <span>Click any signal above to remove it.</span>
                <button className="button primary" onClick={applyMemoryDraft}>
                  Apply reviewed profile <Check size={16} />
                </button>
              </div>
            </section>
          ) : null}
          <div className="consent-bar">
            <p><LockKeyhole size={17} /><span><strong>Review before analysis</strong><small>Only selected text and public README content will be sent to GPT-5.6.</small></span></p>
            <button className="button primary" onClick={summarize} disabled={summarizing}>
              {summarizing ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
              {summarizing ? 'Building memory…' : 'Analyze selected context'}
            </button>
          </div>
        </section>

        <aside className="project-inventory">
          <div className="section-heading">
            <div><p className="section-kicker">Project inventory</p><h2>{data.profile.projects.length} reusable assets</h2></div>
          </div>
          {data.profile.careerProfile.headline || data.profile.careerProfile.skills.length ? (
            <section className="career-summary-card">
              <span>Professional evidence</span>
              <h3>{data.profile.careerProfile.headline || 'Documented capabilities'}</h3>
              <p>{data.profile.careerProfile.summary}</p>
              <div className="tag-row">
                {data.profile.careerProfile.skills.slice(0, 8).map((skill) => <em key={skill.name}>{skill.name}</em>)}
              </div>
              <small>{data.profile.careerProfile.experiences.length} experience records · editable via CV review</small>
            </section>
          ) : null}
          {Object.keys(data.profile.learnedDomainWeights).length ? (
            <section className="learned-signals">
              <span>Learned from decisions</span>
              {Object.entries(data.profile.learnedDomainWeights)
                .sort(([, left], [, right]) => right - left)
                .map(([domain, weight]) => (
                  <div key={domain}><strong>{domain}</strong><em>{weight > 0 ? `+${weight}` : weight}</em></div>
                ))}
              <button onClick={resetLearning}>Clear feedback history &amp; learning</button>
            </section>
          ) : null}
          {data.profile.projects.map((project) => (
            <article key={project.id} className="project-inventory-card">
              <div><span>{project.status}</span><small>{project.sourceLabel}</small></div>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <div className="tag-row">{project.domains.slice(0, 4).map((item) => <em key={item}>{item}</em>)}</div>
            </article>
          ))}
          {!data.profile.projects.length ? (
            <div className="mini-empty"><FileText size={22} /><p>Your project inventory is empty. Import context to improve opportunity matching.</p></div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
