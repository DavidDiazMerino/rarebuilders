import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  AppData,
  BuilderProfile,
  FeedbackAction,
  Opportunity,
  ProjectAsset,
  Strategy,
} from '../../shared/domain'
import { applyFeedbackLearning, createFeedback } from '../lib/scoring'
import { emptyPersonalProfile, initialAppData, loadAppData, saveAppData } from '../lib/storage'

type Action =
  | { type: 'enter-mode'; mode: 'demo' | 'personal' }
  | { type: 'update-profile'; profile: BuilderProfile }
  | { type: 'add-projects'; projects: ProjectAsset[] }
  | { type: 'add-opportunity'; opportunity: Opportunity }
  | { type: 'feedback'; opportunity: Opportunity; action: FeedbackAction; reason?: string }
  | { type: 'strategy'; opportunityId: string; strategy: Strategy }
  | { type: 'reset' }

function reducer(state: AppData, action: Action): AppData {
  if (action.type === 'enter-mode') {
    if (action.mode === 'demo') return { ...initialAppData(), mode: 'demo' }
    return { ...initialAppData(), mode: 'personal', profile: emptyPersonalProfile() }
  }
  if (action.type === 'update-profile') return { ...state, profile: action.profile }
  if (action.type === 'add-projects') {
    const byName = new Map(state.profile.projects.map((project) => [project.name.toLowerCase(), project]))
    for (const project of action.projects) byName.set(project.name.toLowerCase(), project)
    return { ...state, profile: { ...state.profile, projects: [...byName.values()] } }
  }
  if (action.type === 'add-opportunity') {
    const others = state.opportunities.filter((opportunity) => opportunity.id !== action.opportunity.id)
    return { ...state, opportunities: [action.opportunity, ...others] }
  }
  if (action.type === 'feedback') {
    const event = createFeedback(action.opportunity, action.action, action.reason)
    return {
      ...state,
      profile: applyFeedbackLearning(state.profile, event),
      feedback: [...state.feedback.filter((item) => item.opportunityId !== action.opportunity.id), event],
    }
  }
  if (action.type === 'strategy') {
    return { ...state, strategies: { ...state.strategies, [action.opportunityId]: action.strategy } }
  }
  return initialAppData()
}

type AppStateValue = {
  data: AppData
  enterMode: (mode: 'demo' | 'personal') => void
  updateProfile: (profile: BuilderProfile) => void
  addProjects: (projects: ProjectAsset[]) => void
  addOpportunity: (opportunity: Opportunity) => void
  recordFeedback: (opportunity: Opportunity, action: FeedbackAction, reason?: string) => void
  saveStrategy: (opportunityId: string, strategy: Strategy) => void
  reset: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadAppData)
  useEffect(() => saveAppData(data), [data])

  const value = useMemo<AppStateValue>(() => ({
    data,
    enterMode: (mode) => dispatch({ type: 'enter-mode', mode }),
    updateProfile: (profile) => dispatch({ type: 'update-profile', profile }),
    addProjects: (projects) => dispatch({ type: 'add-projects', projects }),
    addOpportunity: (opportunity) => dispatch({ type: 'add-opportunity', opportunity }),
    recordFeedback: (opportunity, action, reason) => dispatch({ type: 'feedback', opportunity, action, reason }),
    saveStrategy: (opportunityId, strategy) => dispatch({ type: 'strategy', opportunityId, strategy }),
    reset: () => dispatch({ type: 'reset' }),
  }), [data])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}
