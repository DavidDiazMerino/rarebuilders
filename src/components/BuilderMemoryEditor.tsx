import { Plus, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { BuilderProfile, CareerExperience, ProjectAsset } from '../../shared/domain'

const splitList = (value: string) => [...new Set(value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean))]

function ListField({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        value={values.join(', ')}
        onChange={(event) => onChange(splitList(event.target.value))}
        placeholder="Comma-separated"
      />
    </label>
  )
}

const emptyProject = (): ProjectAsset => ({
  id: crypto.randomUUID(),
  name: 'Untitled project',
  summary: '',
  domains: [],
  technologies: [],
  status: 'idea',
  reusableAssets: [],
  sourceLabel: 'Manual',
})

const emptyExperience = (): CareerExperience => ({
  id: crypto.randomUUID(),
  role: 'Untitled role',
  organization: '',
  period: '',
  summary: '',
  domains: [],
  skills: [],
  achievements: [],
})

export function BuilderMemoryEditor({
  profile,
  onSave,
  onClose,
}: {
  profile: BuilderProfile
  onSave: (profile: BuilderProfile) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(profile)
  const updateProject = (id: string, patch: Partial<ProjectAsset>) => {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === id ? { ...project, ...patch } : project),
    }))
  }
  const updateExperience = (id: string, patch: Partial<CareerExperience>) => {
    setDraft((current) => ({
      ...current,
      careerProfile: {
        ...current.careerProfile,
        experiences: current.careerProfile.experiences.map((experience) =>
          experience.id === id ? { ...experience, ...patch } : experience),
      },
    }))
  }

  return (
    <section className="memory-editor">
      <div className="memory-review-heading">
        <div>
          <p className="section-kicker">Editable source of truth</p>
          <h2>Review every signal that can affect ranking.</h2>
        </div>
        <button className="icon-button" title="Close memory editor" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="memory-editor-grid">
        <label><span>Name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <ListField label="Core domains" values={draft.domains} onChange={(domains) => setDraft({ ...draft, domains })} />
        <ListField label="Wildcard domains" values={draft.wildcardDomains} onChange={(wildcardDomains) => setDraft({ ...draft, wildcardDomains })} />
        <ListField label="No-go domains" values={draft.noGoDomains} onChange={(noGoDomains) => setDraft({ ...draft, noGoDomains })} />
        <ListField label="Fast skills" values={draft.fastSkills} onChange={(fastSkills) => setDraft({ ...draft, fastSkills })} />
        <ListField label="Technologies to explore" values={draft.technologiesToExplore} onChange={(technologiesToExplore) => setDraft({ ...draft, technologiesToExplore })} />
        <ListField label="Regions" values={draft.regions} onChange={(regions) => setDraft({ ...draft, regions })} />
        <ListField label="Languages" values={draft.languages} onChange={(languages) => setDraft({ ...draft, languages })} />
      </div>

      <div className="memory-editor-section">
        <div className="section-heading">
          <div><p className="section-kicker">Professional evidence</p><h3>Career profile</h3></div>
          <button onClick={() => setDraft({
            ...draft,
            careerProfile: {
              ...draft.careerProfile,
              skills: [...draft.careerProfile.skills, { name: 'New skill', evidence: [], confidence: 100 }],
            },
          })}><Plus size={14} /> Skill</button>
        </div>
        <label><span>Headline</span><input value={draft.careerProfile.headline} onChange={(event) => setDraft({
          ...draft,
          careerProfile: { ...draft.careerProfile, headline: event.target.value },
        })} /></label>
        <label><span>Summary</span><textarea value={draft.careerProfile.summary} onChange={(event) => setDraft({
          ...draft,
          careerProfile: { ...draft.careerProfile, summary: event.target.value },
        })} /></label>
        <div className="editable-chip-list">
          {draft.careerProfile.skills.map((skill, index) => (
            <div key={`${skill.name}-${index}`}>
              <input value={skill.name} aria-label={`Skill ${index + 1}`} onChange={(event) => setDraft({
                ...draft,
                careerProfile: {
                  ...draft.careerProfile,
                  skills: draft.careerProfile.skills.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name: event.target.value } : item),
                },
              })} />
              <button title="Remove skill" onClick={() => setDraft({
                ...draft,
                careerProfile: {
                  ...draft.careerProfile,
                  skills: draft.careerProfile.skills.filter((_, itemIndex) => itemIndex !== index),
                },
              })}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="section-heading compact">
          <strong>Experience</strong>
          <button onClick={() => setDraft({
            ...draft,
            careerProfile: {
              ...draft.careerProfile,
              experiences: [...draft.careerProfile.experiences, emptyExperience()],
            },
          })}><Plus size={14} /> Experience</button>
        </div>
        {draft.careerProfile.experiences.map((experience) => (
          <article className="memory-edit-card" key={experience.id}>
            <button className="remove-memory-item" title="Remove experience" onClick={() => setDraft({
              ...draft,
              careerProfile: {
                ...draft.careerProfile,
                experiences: draft.careerProfile.experiences.filter((item) => item.id !== experience.id),
              },
            })}><Trash2 size={14} /></button>
            <input value={experience.role} onChange={(event) => updateExperience(experience.id, { role: event.target.value })} />
            <input value={experience.organization} placeholder="Organization" onChange={(event) => updateExperience(experience.id, { organization: event.target.value })} />
            <input value={experience.period} placeholder="Period" onChange={(event) => updateExperience(experience.id, { period: event.target.value })} />
            <textarea value={experience.summary} placeholder="Evidence-backed summary" onChange={(event) => updateExperience(experience.id, { summary: event.target.value })} />
            <ListField label="Domains" values={experience.domains} onChange={(domains) => updateExperience(experience.id, { domains })} />
            <ListField label="Skills" values={experience.skills} onChange={(skills) => updateExperience(experience.id, { skills })} />
          </article>
        ))}
      </div>

      <div className="memory-editor-section">
        <div className="section-heading">
          <div><p className="section-kicker">Reusable work</p><h3>Projects</h3></div>
          <button onClick={() => setDraft({ ...draft, projects: [...draft.projects, emptyProject()] })}><Plus size={14} /> Project</button>
        </div>
        {draft.projects.map((project) => (
          <article className="memory-edit-card" key={project.id}>
            <button className="remove-memory-item" title="Remove project" onClick={() => setDraft({
              ...draft,
              projects: draft.projects.filter((item) => item.id !== project.id),
            })}><Trash2 size={14} /></button>
            <input value={project.name} onChange={(event) => updateProject(project.id, { name: event.target.value })} />
            <textarea value={project.summary} onChange={(event) => updateProject(project.id, { summary: event.target.value })} />
            <select value={project.status} onChange={(event) => updateProject(project.id, {
              status: event.target.value as ProjectAsset['status'],
            })}>
              <option value="idea">Idea</option>
              <option value="prototype">Prototype</option>
              <option value="active">Active</option>
              <option value="shipped">Shipped</option>
              <option value="archived">Archived</option>
            </select>
            <ListField label="Domains" values={project.domains} onChange={(domains) => updateProject(project.id, { domains })} />
            <ListField label="Technologies" values={project.technologies} onChange={(technologies) => updateProject(project.id, { technologies })} />
            <ListField label="Reusable assets" values={project.reusableAssets} onChange={(reusableAssets) => updateProject(project.id, { reusableAssets })} />
          </article>
        ))}
      </div>

      <div className="memory-editor-section">
        <p className="section-kicker">Connected public evidence</p>
        <h3>GitHub repositories</h3>
        {draft.connectedGithubRepositories.map((repository) => (
          <div className="connected-repository" key={repository.fullName}>
            <span><strong>{repository.fullName}</strong><small>{repository.description}</small></span>
            <button title="Disconnect repository" onClick={() => setDraft({
              ...draft,
              connectedGithubRepositories: draft.connectedGithubRepositories.filter((item) =>
                item.fullName !== repository.fullName),
            })}><Trash2 size={14} /></button>
          </div>
        ))}
        {!draft.connectedGithubRepositories.length ? <p className="muted-copy">No repositories connected.</p> : null}
      </div>

      <div className="memory-review-actions">
        <span>Changes stay in this browser until you export them.</span>
        <button className="button primary" onClick={() => onSave(draft)}><Save size={16} /> Save builder memory</button>
      </div>
    </section>
  )
}
