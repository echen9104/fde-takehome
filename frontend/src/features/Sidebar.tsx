import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { countBy } from './filters'
import { Dot } from './parts'
import { STATUS_LABEL, type Result, type Status } from './types'

export const STATUSES = Object.keys(STATUS_LABEL) as Status[]

function FilterButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="sm" aria-pressed={active} onClick={onClick}
      className={cn('h-8 w-full justify-start gap-2 px-2', active && 'font-semibold')}>
      {children}<span className="ml-auto font-mono text-xs text-muted-foreground">{count}</span>
    </Button>
  )
}

const Heading = ({ children, first }: { children: React.ReactNode; first?: boolean }) => (
  <h2 className={cn('mx-2 mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase', first ? 'mt-1' : 'mt-4')}>{children}</h2>
)

interface Props {
  all: Result[]; cats: string[]
  status: Status | 'all'; onStatus: (s: Status | 'all') => void
  category: string; onCategory: (c: string) => void
}

/** Desktop filter column: status buttons, then category buttons, each with a count. */
export function Sidebar({ all, cats, status, onStatus, category, onCategory }: Props) {
  return (
    <nav aria-label="Filters" className="hidden overflow-auto border-r px-2 py-3 md:block">
      <Heading first>Status</Heading>
      <FilterButton active={status === 'all'} onClick={() => onStatus('all')} count={all.length}>All</FilterButton>
      {STATUSES.map((s) => (
        <FilterButton key={s} active={status === s} onClick={() => onStatus(s)} count={countBy(all, 'status', s)}>{STATUS_LABEL[s]}</FilterButton>
      ))}
      <Heading>Category</Heading>
      <FilterButton active={category === 'all'} onClick={() => onCategory('all')} count={all.length}>All</FilterButton>
      {cats.map((c) => (
        <FilterButton key={c} active={category === c} onClick={() => onCategory(c)} count={countBy(all, 'category', c)}><Dot category={c} />{c}</FilterButton>
      ))}
    </nav>
  )
}
