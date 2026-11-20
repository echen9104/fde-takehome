export type Status = 'ok' | 'needs_review' | 'fallback'

export interface Result {
  id: number
  title: string
  url: string
  posted_at: string | null
  category: string
  confidence: number
  status: Status
  summary: string | null
  extra: Record<string, string>
}

export const THRESHOLD = 0.6 // keep in step with CONFIDENCE_THRESHOLD in service/llm.py
export const STATUS_LABEL: Record<Status, string> = { ok: 'OK', needs_review: 'Needs review', fallback: 'Fallback' }
export const CATEGORY_COLOR: Record<string, string> = {
  security: '#f87171', ai_ml: '#a78bfa', programming: '#60a5fa', business: '#fbbf24', science: '#2dd4bf', other: '#94a3b8',
}
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
