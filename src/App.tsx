import { useMemo, useState } from 'react'
import './App.css'
import { rankOpportunities, starterProfile, type UserProfile } from './scoring'

const domainOptions = [
  ['ai-agents', 'Agentes IA'],
  ['developer-tools', 'Dev tools'],
  ['education', 'Educación'],
  ['creative-tech', 'Creative tech'],
  ['biotech', 'CRISPR / biotech'],
  ['hardware', 'Hardware / físico'],
  ['climate', 'Climate'],
  ['space', 'Space'],
]

function App() {
  const [profile, setProfile] = useState<UserProfile>(starterProfile)
  const ranked = useMemo(() => rankOpportunities(profile), [profile])
  const top = ranked[0]

  const toggleDomain = (domain: string) => {
    setProfile((current) => ({
      ...current,
      domains: current.domains.includes(domain)
        ? current.domains.filter((item) => item !== domain)
        : [...current.domains, domain],
    }))
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">Merino Labs · rare opportunity intelligence</p>
        <h1>RareBuilders</h1>
        <p className="lede">
          Un radar personal para encontrar hackathones, grants y challenges raros antes de que lleguen a la masa.
          No busca “más eventos”: busca ventajas injustas para tu universo de proyectos.
        </p>
        <div className="hero-actions">
          <a href="#profile" className="primary">Perfilar builder</a>
          <a href="#radar" className="secondary">Ver radar demo</a>
        </div>
      </section>

      <section className="grid two" id="profile">
        <article className="card">
          <p className="eyebrow">Paso 1</p>
          <h2>Perfil vivo, no formulario muerto</h2>
          <p>
            RareBuilders aprende qué rarezas sí te interesan: IA, literatura, agentes, educación,
            CRISPR si aparece una opción razonable, hardware, relojes, comunidades pequeñas o convocatorias locales.
          </p>
          <div className="chips">
            {domainOptions.map(([value, label]) => (
              <button
                key={value}
                className={profile.domains.includes(value) ? 'chip active' : 'chip'}
                onClick={() => toggleDomain(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </article>

        <article className="card control-card">
          <label>
            Horas disponibles esta semana
            <input
              type="range"
              min="4"
              max="40"
              value={profile.weeklyHours}
              onChange={(event) => setProfile({ ...profile, weeklyHours: Number(event.target.value) })}
            />
            <strong>{profile.weeklyHours}h</strong>
          </label>
          <label>
            Apetito de rareza
            <select
              value={profile.appetite}
              onChange={(event) => setProfile({ ...profile, appetite: event.target.value as UserProfile['appetite'] })}
            >
              <option value="safe">Seguro</option>
              <option value="balanced">Balanceado</option>
              <option value="weird">Acepto relojes, CRISPR y cosas raras</option>
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={profile.wildcardMode}
              onChange={(event) => setProfile({ ...profile, wildcardMode: event.target.checked })}
            />
            Incluir wildcards fuera de mi campo habitual
          </label>
        </article>
      </section>

      <section className="radar" id="radar">
        <div>
          <p className="eyebrow">Paso 2</p>
          <h2>Radar de oportunidades</h2>
          <p>
            Cada oportunidad se normaliza y se puntúa por encaje personal, probabilidad de ganar,
            valor estratégico, coste y grado de ocultación.
          </p>
        </div>
        <div className="top-pick">
          <span>Mejor ahora</span>
          <strong>{top.title}</strong>
          <small>{top.overall}/100 · {top.source}</small>
        </div>
      </section>

      <section className="opportunity-list">
        {ranked.map((item) => (
          <article className="opportunity" key={item.id}>
            <header>
              <div>
                <p className="source">{item.source} · {item.region} · {item.language}</p>
                <h3>{item.title}</h3>
              </div>
              <div className="score">{item.overall}</div>
            </header>
            <p>{item.notes}</p>
            <div className="metrics">
              <span>Fit {item.fitScore}</span>
              <span>Win signal {item.winSignal}</span>
              <span>Hiddenness {item.hiddenness}</span>
              <span>{item.effortHours}h</span>
            </div>
            <div className="angle">
              <strong>Ángulo Merino Labs</strong>
              <p>{item.merinoLabsAngle}</p>
            </div>
            <div className="angle muted">
              <strong>Build sugerido</strong>
              <p>{item.suggestedBuild}</p>
            </div>
            <ul>
              {item.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <footer>
              <button>Me interesa</button>
              <button>No es para mí</button>
              <button>Más así</button>
            </footer>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
