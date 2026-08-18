export interface FixEffectiveness {
  finding_key: string
  label: string
  total_attempts: number
  successful_implementations: number
  avg_score_improvement: number
  positive_outcomes: number
  success_rate_percentage: number
}

export interface GetFixLibraryResponse {
  fixes: FixEffectiveness[]
}

export interface FixHistoryEntry {
  id: string
  audit_id: string
  finding_key: string
  label: string
  implemented: boolean
  verification_method: string
  notes: string | null
  score_before: number | null
  score_after: number | null
  score_improvement: number | null
  implemented_at: string | null
  url: string
  audit_score: number | null
}

export interface GetFixHistoryResponse {
  email: string
  history: FixHistoryEntry[]
}