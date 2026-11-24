import { useMemo, useState } from 'react'
import { DetailPanel } from './features/DetailPanel'
import { applyFilters, type Sort } from './features/filters'
import { Header } from './features/Header'
import { DiagramsPage } from './features/DiagramsPage'
import { useArrowKeys, useDiagramsPage, useResults, useWide } from './features/hooks'
import { MobileFilters } from './features/MobileFilters'
import { ResultsTable } from './features/ResultsTable'
import { Sidebar } from './features/Sidebar'
import type { Status } from './features/types'

/** Owns the state (filters, selection) and lays the pieces out. Each piece lives in features/. */
export default function App() {
  const diagrams = useDiagramsPage()
  const { data, updated } = useResults()
  const wide = useWide()
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [category, setCategory] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('new')
  const [sel, setSel] = useState<number | null>(null)

  const all = useMemo(() => data ?? [], [data])
  const rows = useMemo(() => applyFilters(all, { status, category, q, sort }), [all, status, category, q, sort])
  const cats = useMemo(() => [...new Set(all.map((r) => r.category))].sort(), [all])

  // wide screens always show a detail pane for a visible row; narrow ones open the sheet only on click
  const current = rows.find((r) => r.id === sel) ?? (wide ? rows[0] : undefined)
  useArrowKeys(rows, current?.id, setSel)

  const emptyText = data === null ? 'Loading…' : all.length ? 'No stories match these filters.' : 'No results yet. The first ones appear after the model finishes loading.'
  const filters = { all, cats, status, onStatus: setStatus, category, onCategory: setCategory }

  if (diagrams) return <DiagramsPage />

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header q={q} onQ={setQ} sort={sort} onSort={setSort} updated={updated} />
      <MobileFilters {...filters} />
      <div className="grid min-h-0 flex-1 grid-cols-1 min-[768px]:max-[1099px]:grid-cols-[224px_minmax(0,1fr)] min-[1100px]:grid-cols-[224px_minmax(0,1fr)_400px]">
        <Sidebar {...filters} />
        <ResultsTable rows={rows} selectedId={current?.id} onSelect={setSel} emptyText={emptyText} />
        <DetailPanel wide={wide} current={current} open={sel !== null} onClose={() => setSel(null)} />
      </div>
    </div>
  )
}
