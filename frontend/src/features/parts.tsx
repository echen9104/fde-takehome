import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { CATEGORY_COLOR, STATUS_LABEL, type Status } from './types'

export function Dot({ category }: { category: string }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other }} />
}

export const STATUS_STYLE: Record<Status, string> = {
  ok: 'text-green-500', needs_review: 'text-amber-400', fallback: 'text-red-400',
}
export function StatusIcon({ status }: { status: Status }) {
  const Icon = { ok: CircleCheck, needs_review: TriangleAlert, fallback: CircleX }[status]
  return <Icon className={`size-4 ${STATUS_STYLE[status]}`} role="img" aria-label={STATUS_LABEL[status]} />
}
