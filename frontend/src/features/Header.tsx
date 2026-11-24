import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Sort } from './filters'

interface Props { q: string; onQ: (v: string) => void; sort: Sort; onSort: (v: Sort) => void; updated: string }

/** Title, search box, sort dropdown, "updated" clock. */
export function Header({ q, onQ, sort, onSort, updated }: Props) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2 md:h-14 md:gap-3 md:py-0">
      <h1 className="text-base font-semibold">HN triage</h1>
      <a href="#diagrams" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
      <div className="flex-1" />
      <Input type="search" placeholder="Search stories…" aria-label="Search stories" value={q} onChange={(e) => onQ(e.target.value)}
        className="order-last basis-full md:order-none md:w-64 md:basis-auto" />
      <Select value={sort} onValueChange={(v) => onSort(v as Sort)}>
        <SelectTrigger aria-label="Sort" className="w-44"><SelectValue>{sort === 'new' ? 'Newest' : 'Lowest confidence'}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="new">Newest</SelectItem><SelectItem value="low">Lowest confidence</SelectItem></SelectContent>
      </Select>
      <span role="status" className="text-xs whitespace-nowrap text-muted-foreground max-md:hidden">{updated}</span>
    </header>
  )
}
