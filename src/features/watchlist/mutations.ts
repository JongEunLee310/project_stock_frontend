import { apiPost } from '@/shared/api/client'

interface AnalysisJob {
  job_id: string
  status: 'queued'
}

export async function triggerAnalysis(
  watchlistId: number,
): Promise<AnalysisJob> {
  const { data } = await apiPost<AnalysisJob>('/worker/jobs/analysis', {
    watchlist_id: watchlistId,
  })

  return data
}
