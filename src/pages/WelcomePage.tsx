import { ArrowRight, BrainCircuit, Compass, FileStack, Radar, Sparkles } from 'lucide-react'
import { useAppState } from '../state/AppState'

export function WelcomePage() {
  const { enterMode } = useAppState()

  const enter = (mode: 'demo' | 'personal') => {
    enterMode(mode)
  }

  return (
    <main className="welcome">
      <header className="welcome-nav">
        <div className="brand-lockup">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>
            <strong>RareBuilders</strong>
            <small>Merino Labs</small>
          </span>
        </div>
        <span className="build-week-tag">Built for OpenAI Build Week</span>
      </header>

      <section className="welcome-grid">
        <div className="welcome-copy">
          <p className="section-kicker">Personal opportunity intelligence</p>
          <h1>Stop chasing the biggest opportunity. Find the one where you have an edge.</h1>
          <p className="welcome-lede">
            RareBuilders finds overlooked challenges, grants and bounties, then combines the source evidence
            with your projects, constraints and appetite for weirdness.
          </p>
          <div className="thesis-list">
            <span><Radar size={19} /> Not another hackathon directory</span>
            <span><BrainCircuit size={19} /> A living model of what you can actually win</span>
            <span><Compass size={19} /> Two practical, two rare, one wildcard</span>
          </div>
        </div>

        <div className="entry-panel">
          <p className="entry-panel-label">Choose your starting point</p>
          <button className="entry-choice featured" onClick={() => enter('demo')}>
            <span className="entry-icon"><Radar size={22} /></span>
            <span>
              <strong>Explore David’s radar</strong>
              <small>Start with a populated profile, real product context and five ranked opportunities.</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <button className="entry-choice" onClick={() => enter('personal')}>
            <span className="entry-icon"><FileStack size={22} /></span>
            <span>
              <strong>Build my profile</strong>
              <small>Answer six decisions, then optionally import Markdown notes and public GitHub projects.</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <p className="privacy-note">No account required. Your builder profile stays in this browser.</p>
        </div>
      </section>

      <footer className="welcome-proof">
        <div><strong>5</strong><span>ranked picks, not an infinite feed</span></div>
        <div><strong>6</strong><span>separate signals with confidence</span></div>
        <div><strong>1</strong><span>clear decision for each opportunity</span></div>
      </footer>
    </main>
  )
}
