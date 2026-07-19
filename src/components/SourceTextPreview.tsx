import type { ReactNode } from 'react'

function inlineText(value: string): ReactNode[] {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (link) {
      return <a key={`${part}-${index}`} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    }
    return part
  })
}

export function SourceTextPreview({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let list: string[] = []

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {list.map((item, index) => <li key={`${item}-${index}`}>{inlineText(item)}</li>)}
      </ul>,
    )
    list = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      return
    }
    if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ''))
      return
    }
    flushList()
    if (line.startsWith('### ')) {
      blocks.push(<h4 key={`block-${blocks.length}`}>{inlineText(line.slice(4))}</h4>)
    } else if (line.startsWith('## ')) {
      blocks.push(<h3 key={`block-${blocks.length}`}>{inlineText(line.slice(3))}</h3>)
    } else if (line.startsWith('# ')) {
      blocks.push(<h2 key={`block-${blocks.length}`}>{inlineText(line.slice(2))}</h2>)
    } else {
      const field = line.match(/^([^:]{2,40}):\s+(.+)$/)
      blocks.push(field
        ? <p className="source-preview-field" key={`block-${blocks.length}`}><strong>{field[1]}</strong><span>{inlineText(field[2])}</span></p>
        : <p key={`block-${blocks.length}`}>{inlineText(line)}</p>)
    }
  })
  flushList()

  return (
    <div className="rendered-source">
      {blocks.length ? blocks : <p className="muted-copy">Fetch or paste a source to preview it here.</p>}
    </div>
  )
}
