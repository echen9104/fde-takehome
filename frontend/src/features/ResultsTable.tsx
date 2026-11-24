import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Dot, StatusIcon } from './parts'
import { THRESHOLD, host, type Result } from './types'

interface Props { rows: Result[]; selectedId: number | undefined; onSelect: (id: number) => void; emptyText: string }

/** The story list. On narrow screens each row turns into a wrapped card (the max-md: classes). */
export function ResultsTable({ rows, selectedId, onSelect, emptyText }: Props) {
  return (
    <div className="min-h-0 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background max-md:hidden [&_tr]:border-b">
          <TableRow>
            <TableHead className="pl-4">Story</TableHead>
            <TableHead className="w-32">Category</TableHead>
            <TableHead className="w-14 text-right">Conf</TableHead>
            <TableHead className="w-12 pr-4"><span className="sr-only">Status</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} data-row={r.id} tabIndex={0} data-state={r.id === selectedId ? 'selected' : undefined}
              onClick={() => onSelect(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') onSelect(r.id) }}
              className="h-10 cursor-pointer max-md:relative max-md:flex max-md:h-auto max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:py-2.5 max-md:pr-11 max-md:pl-4">
              <TableCell className="max-w-0 truncate pl-4 max-md:max-w-none max-md:basis-full max-md:p-0 max-md:whitespace-normal">
                {r.title}<span className="ml-2 text-xs text-muted-foreground">{host(r.url)}</span>
              </TableCell>
              <TableCell className="max-md:p-0">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Dot category={r.category} />{r.category}</span>
              </TableCell>
              <TableCell className={cn('text-right font-mono text-xs max-md:p-0', r.confidence < THRESHOLD ? 'font-semibold text-amber-400' : 'text-muted-foreground')}>
                {r.confidence.toFixed(2)}
              </TableCell>
              <TableCell className="pr-4 text-right max-md:absolute max-md:top-3 max-md:right-4 max-md:p-0"><StatusIcon status={r.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <p className="p-12 text-center text-sm text-muted-foreground">{emptyText}</p>}
    </div>
  )
}
