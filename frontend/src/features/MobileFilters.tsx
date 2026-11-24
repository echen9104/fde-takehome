import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { countBy } from './filters'
import { STATUSES } from './Sidebar'
import { STATUS_LABEL, type Result, type Status } from './types'

interface Props {
  all: Result[]; cats: string[]
  status: Status | 'all'; onStatus: (s: Status | 'all') => void
  category: string; onCategory: (c: string) => void
}

/** Narrow screens (<768px): two dropdowns replace the sidebar. */
export function MobileFilters({ all, cats, status, onStatus, category, onCategory }: Props) {
  return (
    <div className="flex gap-2 border-b px-4 py-2 md:hidden">
      <Select value={status} onValueChange={(v) => onStatus(v as Status | 'all')}>
        <SelectTrigger aria-label="Status" className="flex-1"><SelectValue>{status === 'all' ? 'All statuses' : STATUS_LABEL[status]}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses ({all.length})</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]} ({countBy(all, 'status', s)})</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={(v) => onCategory(v ?? 'all')}>
        <SelectTrigger aria-label="Category" className="flex-1"><SelectValue>{category === 'all' ? 'All categories' : category}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories ({all.length})</SelectItem>
          {cats.map((c) => <SelectItem key={c} value={c}>{c} ({countBy(all, 'category', c)})</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
