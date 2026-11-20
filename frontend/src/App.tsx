import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Detail, Dot, StatusIcon } from './features/parts'
import { STATUS_LABEL, THRESHOLD, host, type Result, type Status } from './features/types'

const WIDE = '(min-width: 1100px)'
const useWide = () => {
  const [w, setW] = useState(() => window.matchMedia(WIDE).matches)
  useEffect(() => {
    const m = window.matchMedia(WIDE), f = () => setW(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return w
}

function FilterButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="sm" aria-pressed={active} onClick={onClick}
      className={cn('h-8 w-full justify-start gap-2 px-2', active && 'font-semibold')}>
      {children}<span className="ml-auto font-mono text-xs text-muted-foreground">{count}</span>
    </Button>
  )
}

export default function App() {
  const [data, setData] = useState<Result[] | null>(null)
  const [updated, setUpdated] = useState('loading…')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [category, setCategory] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'new' | 'low'>('new')
  const [sel, setSel] = useState<number | null>(null)
  const wide = useWide()

  useEffect(() => {
    const load = async () => {
      try {
        setData(await (await fetch('/results?limit=200')).json())
        setUpdated('updated ' + new Date().toLocaleTimeString())
      } catch { setUpdated('offline, retrying…') }
    }
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const all = data ?? []
  const rows = useMemo(() => {
    const s = q.toLowerCase()
    const r = all.filter((x) => (status === 'all' || x.status === status) && (category === 'all' || x.category === category)
      && (!s || (x.title + ' ' + (x.summary ?? '')).toLowerCase().includes(s)))
    return sort === 'low' ? [...r].sort((a, b) => a.confidence - b.confidence) : r // API returns newest first
  }, [all, status, category, q, sort])

  // wide screens always show a detail pane for a visible row; narrow ones open the sheet only on click
  const current = rows.find((r) => r.id === sel) ?? (wide ? rows[0] : undefined)
  const cats = [...new Set(all.map((r) => r.category))].sort()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || (e.target as HTMLElement).matches('input,[role=combobox]')) return
      const i = rows.findIndex((r) => r.id === current?.id)
      const next = rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]
      if (!next) return
      e.preventDefault(); setSel(next.id)
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-row="${next.id}"]`)?.focus())
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rows, current])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2 md:h-14 md:gap-3 md:py-0">
        <h1 className="text-base font-semibold">HN triage</h1>
        <div className="flex-1" />
        <Input type="search" placeholder="Search stories…" aria-label="Search stories" className="order-last basis-full md:order-none md:w-64 md:basis-auto" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={sort} onValueChange={(v) => setSort(v as 'new' | 'low')}>
          <SelectTrigger aria-label="Sort" className="w-44"><SelectValue>{sort === 'new' ? 'Newest' : 'Lowest confidence'}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="new">Newest</SelectItem><SelectItem value="low">Lowest confidence</SelectItem></SelectContent>
        </Select>
        <span role="status" className="text-xs whitespace-nowrap text-muted-foreground max-md:hidden">{updated}</span>
      </header>

      {/* narrow screens: two dropdowns instead of the sidebar */}
      <div className="flex gap-2 border-b px-4 py-2 md:hidden">
        <Select value={status} onValueChange={(v) => setStatus(v as Status | 'all')}>
          <SelectTrigger aria-label="Status" className="flex-1"><SelectValue>{status === 'all' ? 'All statuses' : STATUS_LABEL[status]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses ({all.length})</SelectItem>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]} ({all.filter((r) => r.status === s).length})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => setCategory(v ?? 'all')}>
          <SelectTrigger aria-label="Category" className="flex-1"><SelectValue>{category === 'all' ? 'All categories' : category}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories ({all.length})</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c} ({all.filter((r) => r.category === c).length})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 min-[768px]:max-[1099px]:grid-cols-[224px_minmax(0,1fr)] min-[1100px]:grid-cols-[224px_minmax(0,1fr)_400px]">
        <nav aria-label="Filters" className="hidden overflow-auto border-r px-2 py-3 md:block">
          <h2 className="mx-2 mt-1 mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Status</h2>
          <FilterButton active={status === 'all'} onClick={() => setStatus('all')} count={all.length}>All</FilterButton>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <FilterButton key={s} active={status === s} onClick={() => setStatus(s)} count={all.filter((r) => r.status === s).length}>{STATUS_LABEL[s]}</FilterButton>
          ))}
          <h2 className="mx-2 mt-4 mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Category</h2>
          <FilterButton active={category === 'all'} onClick={() => setCategory('all')} count={all.length}>All</FilterButton>
          {cats.map((c) => (
            <FilterButton key={c} active={category === c} onClick={() => setCategory(c)} count={all.filter((r) => r.category === c).length}><Dot category={c} />{c}</FilterButton>
          ))}
        </nav>

        <div className="min-h-0 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background max-md:hidden [&_tr]:border-b">
              <TableRow><TableHead className="pl-4">Story</TableHead><TableHead className="w-32">Category</TableHead><TableHead className="w-14 text-right">Conf</TableHead><TableHead className="w-12 pr-4"><span className="sr-only">Status</span></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-row={r.id} tabIndex={0} data-state={r.id === current?.id ? 'selected' : undefined}
                  onClick={() => setSel(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') setSel(r.id) }}
                  className="h-10 cursor-pointer max-md:relative max-md:flex max-md:h-auto max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:py-2.5 max-md:pr-11 max-md:pl-4">
                  <TableCell className="max-w-0 truncate pl-4 max-md:max-w-none max-md:basis-full max-md:p-0 max-md:whitespace-normal">
                    {r.title}<span className="ml-2 text-xs text-muted-foreground">{host(r.url)}</span>
                  </TableCell>
                  <TableCell className="max-md:p-0"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Dot category={r.category} />{r.category}</span></TableCell>
                  <TableCell className={cn('text-right font-mono text-xs max-md:p-0', r.confidence < THRESHOLD ? 'font-semibold text-amber-400' : 'text-muted-foreground')}>{r.confidence.toFixed(2)}</TableCell>
                  <TableCell className="pr-4 text-right max-md:absolute max-md:top-3 max-md:right-4 max-md:p-0"><StatusIcon status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && (
            <p className="p-12 text-center text-sm text-muted-foreground">
              {data === null ? 'Loading…' : all.length ? 'No stories match these filters.' : 'No results yet. The first ones appear after the model finishes loading.'}
            </p>
          )}
        </div>

        {wide ? (
          <aside className="min-h-0 overflow-auto border-l" aria-live="polite">{current && <Detail r={current} />}</aside>
        ) : (
          <Sheet open={sel !== null && !!current} onOpenChange={(o) => { if (!o) setSel(null) }}>
            <SheetContent side="bottom" className="max-h-[70vh] overflow-auto">
              <SheetHeader className="sr-only"><SheetTitle>Story details</SheetTitle><SheetDescription>Summary and extracted fields</SheetDescription></SheetHeader>
              {current && <Detail r={current} />}
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
}
