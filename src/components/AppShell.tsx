import {
  Archive,
  Binoculars,
  CircleUserRound,
  Crosshair,
  FileInput,
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
  const { data, reset } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const refreshingSources = useDailyDiscovery()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const handleReset = () => {
    if (!window.confirm('Reset this browser to the welcome screen and clear local RareBuilders data?')) return
    reset()
    navigate('/')
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
      </aside>
      <main className="product-main">{children}</main>
    </div>
  )
}
