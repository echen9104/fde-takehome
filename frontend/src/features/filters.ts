import type { Result, Status } from './types'

export type Sort = 'new' | 'low'
export interface Filters { status: Status | 'all'; category: string; q: string; sort: Sort }

/** Pure: apply the status, category and search filters, then the sort. */
export function applyFilters(all: Result[], f: Filters): Result[] {
  const s = f.q.toLowerCase()
  const rows = all.filter((x) =>
    (f.status === 'all' || x.status === f.status) &&
    (f.category === 'all' || x.category === f.category) &&
    (!s || (x.title + ' ' + (x.summary ?? '')).toLowerCase().includes(s)))
  // API returns newest first, so 'new' keeps the order
  return f.sort === 'low' ? [...rows].sort((a, b) => a.confidence - b.confidence) : rows
}

export const countBy = (all: Result[], key: 'status' | 'category', value: string) =>
  all.filter((r) => r[key] === value).length
