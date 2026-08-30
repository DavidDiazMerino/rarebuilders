import { Activity, AlertTriangle, Check, LoaderCircle, Pause, Play, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ScanRun } from '../../shared/domain'
import { PageHeader } from '../components/PageHeader'
import { api } from '../lib/api'

type Status = Awaited<ReturnType<typeof api.sourceStatus>>['data']
type Pack = Awaited<ReturnType<typeof api.sourceCapabilities>>['data']['packs'][number]

export function OperationsPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [packs, setPacks] = useState<Pack[]>([])
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = async () => {
    const [statusResponse, capabilitiesResponse] = await Promise.all([
      api.sourceStatus(),
      api.sourceCapabilities(),
    ])
    setStatus(statusResponse.data)
    setPacks(capabilitiesResponse.data.packs)
  }

  useEffect(() => {
    void refresh().catch(() => setMessage('Source operations are temporarily unavailable.'))
  }, [])

  const run = async (action: 'dry-run' | 'scan') => {
    setRunning(true)
    setMessage('')
    try {
      const response = await api.sourceControl({ action })
      const result = response.data as ScanRun
      setMessage(`${action === 'dry-run' ? 'Dry run' : 'Scan'} complete: ${result.signalsPromoted} promoted, ${result.errors.length} source errors.`)
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The source operation failed.')
    } finally {
      setRunning(false)
    }
  }

  const togglePack = async (packId: string, paused: boolean) => {
    setRunning(true)
    try {
      await api.sourceControl({ action: paused ? 'resume' : 'pause', packId })
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The pack could not be updated.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Source operations"
        title="Control the opportunity radar without touching personal memory."
        description="Public monitors run twice weekly. This page exposes source health, scan results and the bounded automatic-analysis budget."
        actions={(
          <>
            <button className="button secondary" disabled={running || !status?.owner} onClick={() => void run('dry-run')}>
              {running ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />} Dry run
            </button>
            <button className="button primary" disabled={running || !status?.owner} onClick={() => void run('scan')}>
              {running ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} Run scan
            </button>
          </>
        )}
      />

      {message ? <div className="operations-message"><Activity size={16} /> {message}</div> : null}

      {status && !status.owner ? (
        <div className="operations-message"><ShieldCheck size={16} /> Add the owner code in Profile to run scans or change source packs.</div>
      ) : null}

      <section className="operations-metrics">
        <article><span>Last scan</span><strong>{status?.updatedAt ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.updatedAt)) : 'Not run'}</strong></article>
        <article><span>Monitored sources</span><strong>{status?.sourceCount ?? 0}</strong></article>
        <article><span>Retained signals</span><strong>{status?.signalCount ?? 0}</strong></article>
        <article><span>Monthly GPT usage</span><strong>{status?.monthlyAnalysisUsage ?? 'Owner only'}{typeof status?.monthlyAnalysisUsage === 'number' ? ' / 50' : ''}</strong></article>
      </section>

      {status?.latestRun ? (
        <section className="latest-scan-card">
          <div><Check size={17} /><strong>Latest run: {status.latestRun.status}</strong></div>
          <p>{status.latestRun.sourcesChecked} sources · {status.latestRun.sourcesChanged} changed · {status.latestRun.signalsFound} signals · {status.latestRun.signalsPromoted} promoted · {status.latestRun.analysesUsed} analyses</p>
          {status.latestRun.errors.length ? <small><AlertTriangle size={13} /> {status.latestRun.errors.join(' · ')}</small> : null}
        </section>
      ) : null}

      <section className="source-pack-grid">
        {packs.map((pack) => {
          const paused = status?.pausedPackIds.includes(pack.id) ?? false
          return (
            <article className={paused ? 'source-pack-card paused' : 'source-pack-card'} key={pack.id}>
              <div><span>{pack.wildcard ? 'Wildcard' : 'Core lane'}</span><em>{pack.sourceCount} sources</em></div>
              <h2>{pack.label}</h2>
              <p>{pack.description}</p>
              <button className="button secondary" disabled={running || !status?.owner} onClick={() => void togglePack(pack.id, paused)}>
                {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Resume pack' : 'Pause pack'}
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}
