import {
  Archive,
  Binoculars,
  CircleUserRound,
  Crosshair,
  FileInput,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useDailyDiscovery } from '../lib/use-daily-discovery'
import { useAppState } from '../state/AppState'

const navItems = [
  { to: '/radar', label: 'Today’s radar', icon: Crosshair },
  { to: '/discover', label: 'Discover', icon: Binoculars },
  { to: '/inbox', label: 'Add source', icon: FileInput },
  { to: '/library', label: 'Library', icon: Archive },
  { to: '/profile', label: 'Builder memory', icon: CircleUserRound },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { data, enterMode, reset } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const refreshingSources = useDailyDiscovery()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const handleReset = () => {
    if (!window.confirm('Return to the welcome screen and delete this browser’s RareBuilders profile, sources and feedback?')) return
    reset()
    navigate('/')
  }

  const startPersonalProfile = () => {
    if (!window.confirm('Leave David’s demo and start an empty personal profile? Any sources or feedback added during the demo will be cleared.')) return
    enterMode('personal')
    navigate('/profile')
  }

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <NavLink to="/radar" className="brand-lockup" aria-label="RareBuilders home">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={1.8} /></span>
          <span>
            <strong>RareBuilders</strong>
            <small>Opportunity intelligence</small>
          </span>
        </NavLink>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {data.mode === 'demo' ? (
          <div className="mode-card demo">
            <span>Demo mode</span>
            <p>You are using David’s example profile. Adding a live source hides sample opportunities, but it does not replace his profile.</p>
            <button onClick={startPersonalProfile}><CircleUserRound size={14} /> Start my own profile</button>
          </div>
        ) : (
          <div className="mode-card">
            <span>Your private radar</span>
            <p>Only the context you review and apply becomes part of Builder Memory.</p>
          </div>
        )}

        <div className="rail-note">
          <Archive size={17} className={refreshingSources ? 'spin' : ''} />
          <div>
            <span>{refreshingSources ? 'Refreshing sources' : 'Local-first memory'}</span>
            <small>{refreshingSources ? 'Updating today’s candidate pool.' : 'Your profile stays in this browser.'}</small>
          </div>
        </div>

        <div className="profile-chip">
          <div className="avatar">{data.profile.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{data.profile.name}</strong>
            <small>{data.profile.weeklyHours}h available · {data.profile.projects.length} projects</small>
          </div>
          <button className="icon-button" onClick={handleReset} title="Reset product mode">
            <RotateCcw size={15} />
          </button>
        </div>
        <button className="leave-product" onClick={handleReset}>
          <LogOut size={14} /> Exit and choose another starting point
        </button>
      </aside>
      <main className="product-main">{children}</main>
    </div>
  )
}
