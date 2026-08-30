import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  AppData,
  AppSettings,
  BuilderProfile,
  CandidateStatus,
  CareerProfile,
  ConnectorId,
  ConnectorState,
  FeedbackAction,
  FeedbackKind,
  FeedbackReason,
  Opportunity,
  OpportunityCandidate,
  DigestSummary,
  Strategy,
} from '../../shared/domain'
import { mergeBuilderMemory, type BuilderMemoryImport } from '../lib/builder-memory'
import { retainCandidateHistory } from '../lib/candidates'
import {
  createFeedback,
  learnedConstraintWeightsFromFeedback,
  learnedDomainWeightsFromFeedback,
} from '../lib/scoring'
import { demoAppData, initialAppData, loadAppData, personalAppData, saveAppData } from '../lib/storage'

type Action =
  | { type: 'enter-mode'; mode: 'demo' | 'personal' }
  | { type: 'update-profile'; profile: BuilderProfile }
  | { type: 'update-career'; careerProfile: CareerProfile }
  | {
      type: 'import-builder-memory'
      input: BuilderMemoryImport
    }
  | { type: 'upsert-candidates'; candidates: OpportunityCandidate[] }
  | { type: 'candidate-status'; candidateId: string; status: CandidateStatus; opportunityId?: string }
  | { type: 'settings'; settings: AppSettings }
  | { type: 'connector-state'; connector: ConnectorId; connectorState: ConnectorState }
  | { type: 'source-feed'; candidates: OpportunityCandidate[]; opportunities: Opportunity[]; cursor: string; digest: DigestSummary | null }
  | { type: 'add-opportunity'; opportunity: Opportunity }
  | {
      type: 'feedback'
      opportunity: Opportunity
      kind: FeedbackKind
      action: FeedbackAction
      reasonCode?: FeedbackReason
      note?: string
    }
  | { type: 'undo-feedback'; opportunityId: string; kind: FeedbackKind }
  | { type: 'reset-learning' }
  | { type: 'strategy'; opportunityId: string; strategy: Strategy }
  | { type: 'reset' }

function reducer(state: AppData, action: Action): AppData {
  if (action.type === 'enter-mode') {
    if (action.mode === 'demo') return { ...demoAppData(), mode: 'demo' }
    return personalAppData()
  }
  if (action.type === 'update-profile') return { ...state, profile: action.profile }
  if (action.type === 'update-career') {
    return { ...state, profile: { ...state.profile, careerProfile: action.careerProfile } }
  }
  if (action.type === 'import-builder-memory') {
    return {
      ...state,
      profile: mergeBuilderMemory(state.profile, action.input),
    }
  }
  if (action.type === 'upsert-candidates') {
    const byId = new Map(state.candidates.map((candidate) => [candidate.id, candidate]))
    for (const candidate of action.candidates) {
      const previous = byId.get(candidate.id)
      byId.set(candidate.id, previous
        ? {
            ...candidate,
            status: previous.status,
            opportunityId: previous.opportunityId,
            discoveredAt: previous.discoveredAt,
          }
        : candidate)
    }
    return { ...state, candidates: retainCandidateHistory([...byId.values()]) }
  }
  if (action.type === 'candidate-status') {
    return {
      ...state,
      candidates: state.candidates.map((candidate) => candidate.id === action.candidateId
        ? { ...candidate, status: action.status, opportunityId: action.opportunityId ?? candidate.opportunityId }
        : candidate),
    }
  }
  if (action.type === 'settings') return { ...state, settings: action.settings }
  if (action.type === 'connector-state') {
    return {
      ...state,
      connectorState: { ...state.connectorState, [action.connector]: action.connectorState },
    }
  }
  if (action.type === 'source-feed') {
    const candidates = new Map(state.candidates.map((candidate) => [candidate.id, candidate]))
    for (const candidate of action.candidates) {
      const previous = candidates.get(candidate.id)
      candidates.set(candidate.id, previous
        ? { ...candidate, status: previous.status, opportunityId: previous.opportunityId, discoveredAt: previous.discoveredAt }
        : candidate)
    }
    const opportunities = new Map(state.opportunities.map((opportunity) => [opportunity.id, opportunity]))
    action.opportunities.forEach((opportunity) => opportunities.set(opportunity.id, opportunity))
    const digests = action.digest
      ? [action.digest, ...state.digests.filter((digest) => digest.id !== action.digest?.id)].slice(0, 20)
      : state.digests
    return {
      ...state,
      candidates: retainCandidateHistory([...candidates.values()]),
      opportunities: [...opportunities.values()],
      lastSignalCursor: action.cursor || state.lastSignalCursor,
      digests,
    }
  }
  if (action.type === 'add-opportunity') {
    const others = state.opportunities.filter((opportunity) => opportunity.id !== action.opportunity.id)
    return {
      ...state,
      opportunities: [action.opportunity, ...others],
      candidates: action.opportunity.candidateId
        ? state.candidates.map((candidate) => candidate.id === action.opportunity.candidateId
          ? { ...candidate, sourceText: undefined, status: 'added', opportunityId: action.opportunity.id }
          : candidate)
        : state.candidates,
    }
  }
  if (action.type === 'feedback') {
    const latest = [...state.feedback].reverse().find((event) =>
      event.opportunityId === action.opportunity.id && event.kind === action.kind)
    if (
      latest?.action === action.action
      && latest.reasonCode === action.reasonCode
      && latest.note === action.note
    ) return state
    const event = createFeedback(
      action.opportunity,
      action.kind,
      action.action,
      action.reasonCode,
      action.note,
    )
    const feedback = [...state.feedback, event]
    return {
      ...state,
      profile: {
        ...state.profile,
        learnedDomainWeights: learnedDomainWeightsFromFeedback(feedback),
        learnedConstraintWeights: learnedConstraintWeightsFromFeedback(feedback),
      },
      feedback,
    }
  }
  if (action.type === 'undo-feedback') {
    const index = state.feedback.findLastIndex((event) =>
      event.opportunityId === action.opportunityId && event.kind === action.kind)
    if (index < 0) return state
    const feedback = state.feedback.filter((_, eventIndex) => eventIndex !== index)
    return {
      ...state,
      profile: {
        ...state.profile,
        learnedDomainWeights: learnedDomainWeightsFromFeedback(feedback),
        learnedConstraintWeights: learnedConstraintWeightsFromFeedback(feedback),
      },
      feedback,
    }
  }
  if (action.type === 'reset-learning') {
    return {
      ...state,
      profile: {
        ...state.profile,
        learnedDomainWeights: {},
        learnedConstraintWeights: {},
      },
      feedback: [],
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
  updateCareer: (careerProfile: CareerProfile) => void
  importBuilderMemory: (input: BuilderMemoryImport) => void
  upsertCandidates: (candidates: OpportunityCandidate[]) => void
  updateCandidateStatus: (candidateId: string, status: CandidateStatus, opportunityId?: string) => void
  updateSettings: (settings: AppSettings) => void
  updateConnectorState: (connector: ConnectorId, connectorState: ConnectorState) => void
  ingestSourceFeed: (candidates: OpportunityCandidate[], opportunities: Opportunity[], cursor: string, digest: DigestSummary | null) => void
  addOpportunity: (opportunity: Opportunity) => void
  recordFeedback: (
    opportunity: Opportunity,
    kind: FeedbackKind,
    action: FeedbackAction,
    reasonCode?: FeedbackReason,
    note?: string,
  ) => void
  undoFeedback: (opportunityId: string, kind: FeedbackKind) => void
  resetLearning: () => void
  saveStrategy: (opportunityId: string, strategy: Strategy) => void
  reset: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadAppData)
  useEffect(() => {
    saveAppData(data)
  }, [data])

  const value = useMemo<AppStateValue>(() => ({
    data,
    enterMode: (mode) => dispatch({ type: 'enter-mode', mode }),
    updateProfile: (profile) => dispatch({ type: 'update-profile', profile }),
    updateCareer: (careerProfile) => dispatch({ type: 'update-career', careerProfile }),
    importBuilderMemory: (input) => dispatch({ type: 'import-builder-memory', input }),
    upsertCandidates: (candidates) => dispatch({ type: 'upsert-candidates', candidates }),
    updateCandidateStatus: (candidateId, status, opportunityId) =>
      dispatch({ type: 'candidate-status', candidateId, status, opportunityId }),
    updateSettings: (settings) => dispatch({ type: 'settings', settings }),
    updateConnectorState: (connector, connectorState) =>
      dispatch({ type: 'connector-state', connector, connectorState }),
    ingestSourceFeed: (candidates, opportunities, cursor, digest) =>
      dispatch({ type: 'source-feed', candidates, opportunities, cursor, digest }),
    addOpportunity: (opportunity) => dispatch({ type: 'add-opportunity', opportunity }),
    recordFeedback: (opportunity, kind, action, reasonCode, note) =>
      dispatch({ type: 'feedback', opportunity, kind, action, reasonCode, note }),
    undoFeedback: (opportunityId, kind) => dispatch({ type: 'undo-feedback', opportunityId, kind }),
    resetLearning: () => dispatch({ type: 'reset-learning' }),
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
