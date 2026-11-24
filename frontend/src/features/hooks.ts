import { useEffect, useState } from 'react'
import type { Result } from './types'

/** Fetch results now and every 15s. `data` is null until the first response. */
export function useResults() {
  const [data, setData] = useState<Result[] | null>(null)
  const [updated, setUpdated] = useState('loading…')
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
  return { data, updated }
}

/** True on screens >= 1100px, where the detail pane sits beside the list. */
const WIDE = '(min-width: 1100px)'
export function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  useEffect(() => {
    const m = window.matchMedia(WIDE), f = () => setWide(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return wide
}

/** Up/Down arrows move the selection through `rows` and focus the new row. */
export function useArrowKeys(rows: Result[], currentId: number | undefined, select: (id: number) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || (e.target as HTMLElement).matches('input,[role=combobox]')) return
      const i = rows.findIndex((r) => r.id === currentId)
      const next = rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]
      if (!next) return
      e.preventDefault()
      select(next.id)
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-row="${next.id}"]`)?.focus())
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rows, currentId, select])
}
