import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DiscoverPage } from './pages/DiscoverPage'
import { InboxPage } from './pages/InboxPage'
import { LibraryPage } from './pages/LibraryPage'
import { OpportunityPage } from './pages/OpportunityPage'
import { ProfilePage } from './pages/ProfilePage'
import { RadarPage } from './pages/RadarPage'
import { WelcomePage } from './pages/WelcomePage'
import { useAppState } from './state/AppState'
import './App.css'

function ProductRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/radar" element={<RadarPage />} />
        <Route path="/opportunities/:opportunityId" element={<OpportunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="*" element={<Navigate to="/radar" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  const { data } = useAppState()
  return (
    <Routes>
      <Route
        path="/"
        element={data.mode
          ? <Navigate to={data.mode === 'personal' && !data.profile.onboardingComplete ? '/profile' : '/radar'} replace />
          : <WelcomePage />}
      />
      <Route path="/*" element={data.mode ? <ProductRoutes /> : <Navigate to="/" replace />} />
    </Routes>
  )
}
