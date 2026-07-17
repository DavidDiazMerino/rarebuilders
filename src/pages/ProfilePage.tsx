import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileText,
  GitFork,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BuilderProfile, ProjectAsset, RewardPreference, TeamMode } from '../../shared/domain'
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
  const { data, updateProfile, addProjects } = useAppState()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState<NoteDraft[]>([])
  const [githubUser, setGithubUser] = useState('')
  const [repositories, setRepositories] = useState<GithubRepository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedNotes = useMemo(() => notes.filter((note) => note.selected), [notes])
  const confirmedCharacters = selectedNotes.reduce((total, note) => total + note.content.length, 0)

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
      setSelectedRepos(result.data.filter((repo) => !repo.fork).slice(0, 4).map((repo) => repo.fullName))
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
      const projects: ProjectAsset[] = result.data.projects.map((project) => ({
        ...project,
        id: project.id ?? crypto.randomUUID(),
      }))
      addProjects(projects)
      updateProfile({
        ...data.profile,
        fastSkills: [...new Set([...data.profile.fastSkills, ...result.data.fastSkills])],
        domains: [...new Set([...data.profile.domains, ...result.data.domains])],
        technologiesToExplore: [...new Set([...data.profile.technologiesToExplore, ...result.data.technologies])],
      })
      setSuccess(`${projects.length} project${projects.length === 1 ? '' : 's'} added as editable builder memory.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Builder memory analysis failed.')
    } finally {
      setSummarizing(false)
    }
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
          <span>Weekly constraint</span>
          <strong>{data.profile.weeklyHours}h · {data.profile.teamMode} · {data.profile.rewardPreference}</strong>
        </div>
      </section>

      <div className="profile-layout">
        <section className="memory-import">
          <div className="section-heading">
            <div><p className="section-kicker">Import context</p><h2>Use the work you already documented.</h2></div>
          </div>
          <p className="muted-copy">Nothing is sent until you review the exact notes and repositories below.</p>

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
            <div className="github-input">
              <input value={githubUser} onChange={(event) => setGithubUser(event.target.value)} placeholder="GitHub username" />
              <button className="button secondary" onClick={loadGithub} disabled={loadingGithub || !githubUser.trim()}>
                {loadingGithub ? <LoaderCircle className="spin" size={16} /> : <GitFork size={16} />}
                Load public repos
              </button>
            </div>
            {repositories.length ? (
              <div className="repo-picker">
                {repositories.map((repo) => (
                  <button
                    key={repo.id}
                    className={selectedRepos.includes(repo.fullName) ? 'repo-option selected' : 'repo-option'}
                    onClick={() => toggleRepo(repo.fullName)}
                  >
                    <span>{selectedRepos.includes(repo.fullName) ? <Check size={14} /> : <Plus size={14} />}</span>
                    <div><strong>{repo.name}</strong><small>{repo.description || 'No public description'}</small></div>
                    <em>{repo.language ?? 'Mixed'}</em>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {error ? <div className="inline-error"><AlertTriangle size={17} /> <span>{error}</span><button onClick={() => setError('')}><X size={15} /></button></div> : null}
          {success ? <div className="inline-success"><Check size={17} /> {success}</div> : null}
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
