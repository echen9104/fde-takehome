import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Detail } from './Detail'
import type { Result } from './types'

interface Props { wide: boolean; current: Result | undefined; open: boolean; onClose: () => void }

/** Wide screens: a fixed pane on the right. Narrow: a bottom sheet that opens on click. */
export function DetailPanel({ wide, current, open, onClose }: Props) {
  if (wide) return <aside className="min-h-0 overflow-auto border-l" aria-live="polite">{current && <Detail r={current} />}</aside>
  return (
    <Sheet open={open && !!current} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-auto">
        <SheetHeader className="sr-only"><SheetTitle>Story details</SheetTitle><SheetDescription>Summary and extracted fields</SheetDescription></SheetHeader>
        {current && <Detail r={current} />}
      </SheetContent>
    </Sheet>
  )
}
