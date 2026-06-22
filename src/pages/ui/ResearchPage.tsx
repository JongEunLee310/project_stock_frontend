import { useParams } from 'react-router-dom'

import { PagePlaceholder } from './PagePlaceholder'

export function ResearchPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = symbol?.toUpperCase() ?? 'UNKNOWN'

  return (
    <PagePlaceholder
      eyebrow="Research"
      title={`${displaySymbol} Research`}
      summary="Company context, catalysts, valuation notes, and open questions will be collected here."
    />
  )
}
