import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { DIAGRAMS } from './diagrams'

/** Renders one mermaid diagram to SVG. mermaid is loaded on demand so the triage page stays small. */
function Diagram({ id, code }: { id: string; code: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { fontSize: '18px' }, flowchart: { useMaxWidth: false, nodeSpacing: 40, rankSpacing: 50, padding: 12 } })
      try {
        const { svg } = await mermaid.render(id, code)
        if (alive && box.current) box.current.innerHTML = svg // svg of our own static diagrams
      } catch (e) { if (alive) setError(String(e)) }
    })
    return () => { alive = false }
  }, [id, code])
  return error ? <p className="text-sm text-red-400">{error}</p> : <div ref={box} className="overflow-auto rounded-lg border bg-card p-4 [&_svg]:mx-auto" />
}

/** All the architecture diagrams on one page, for walking someone through the project. */
export function DiagramsPage() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <a href="#" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to triage</a>
        <h1 className="text-base font-semibold">How it works</h1>
      </header>
      <main className="min-h-0 flex-1 space-y-8 overflow-auto p-4 md:px-8">
        {DIAGRAMS.map((d, i) => (
          <section key={d.title}>
            <h2 className="text-lg font-semibold">{d.title}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{d.note}</p>
            <Diagram id={`diagram-${i}`} code={d.code} />
          </section>
        ))}
      </main>
    </div>
  )
}
