import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dot, STATUS_STYLE, StatusIcon } from './parts'
import { STATUS_LABEL, THRESHOLD, host, type Result } from './types'

/** Everything we know about one story: summary, confidence bar, extracted fields. */
export function Detail({ r }: { r: Result }) {
  const extra = Object.entries(r.extra ?? {})
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg leading-snug font-semibold">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.title}</a>
        </h2>
        <p className="text-sm text-muted-foreground">{host(r.url)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline"><Dot category={r.category} />{r.category}</Badge>
        <Badge variant="outline" className={STATUS_STYLE[r.status]}><StatusIcon status={r.status} />{STATUS_LABEL[r.status]}</Badge>
      </div>
      <Separator />
      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Summary</h3>
        <p className={r.summary ? '' : 'text-muted-foreground'}>{r.summary ?? 'No summary generated.'}</p>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Confidence</h3>
        <div className="relative h-1.5 rounded-full bg-muted">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${r.confidence * 100}%` }} />
          <div className="absolute -top-1 -bottom-1 w-0.5 bg-muted-foreground" style={{ left: `${THRESHOLD * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{r.confidence.toFixed(2)}</span>{' '}
          {r.confidence < THRESHOLD ? '· below 0.60 threshold, extraction skipped' : '· marker shows the 0.60 review threshold'}
        </p>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Extracted</h3>
        {extra.length === 0 ? <p className="text-muted-foreground">Nothing extracted.</p> : (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
            {extra.map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k.replace(/_/g, ' ')}</dt><dd className="break-words">{v}</dd></div>))}
          </dl>
        )}
      </section>
    </div>
  )
}
