import { Badge, Card } from '@/shared/ui'

interface BriefingHighlight {
  id: string
  theme: string
  summary: string
  evidenceCount: number
}

const briefingHighlights: BriefingHighlight[] = [
  {
    id: 'semiconductor',
    theme: 'AI 반도체',
    summary: 'HBM 공급 확대 기대와 단기 납기 변동 위험이 함께 관찰됩니다.',
    evidenceCount: 8,
  },
  {
    id: 'rates',
    theme: '금리·환율',
    summary:
      '금리 보합으로 성장주 압력은 제한적이나 환율 변동성은 남아 있습니다.',
    evidenceCount: 5,
  },
  {
    id: 'secondary-battery',
    theme: '2차전지',
    summary: '수요 회복 신호보다 재고 조정 관련 부정 이벤트가 우세합니다.',
    evidenceCount: 6,
  },
]

export function AgentBriefing() {
  return (
    <Card aria-labelledby="agent-briefing-title" className="h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="accent">AI 분석</Badge>
            <span className="text-xs text-app-text-muted">11분 전</span>
          </div>
          <h2
            id="agent-briefing-title"
            className="mt-3 text-xl font-semibold text-app-text"
          >
            에이전트 브리핑
          </h2>
        </div>
        <span className="text-2xl text-violet-300" aria-hidden="true">
          ✦
        </span>
      </div>

      <p className="mt-4 rounded-control border border-violet-400/20 bg-violet-400/5 p-4 text-sm leading-6 text-app-text">
        시장은 AI 반도체의 공급 확대 기대를 반영하는 가운데, 일부 공급 일정과
        2차전지 수요 둔화가 상반된 위험 요인으로 나타납니다.
      </p>

      <ul className="mt-4 space-y-3">
        {briefingHighlights.map((highlight) => (
          <li key={highlight.id} className="flex items-start gap-3 text-sm">
            <span className="mt-1 text-violet-300" aria-hidden="true">
              •
            </span>
            <div className="min-w-0 flex-1">
              <strong className="text-app-text">{highlight.theme}</strong>
              <p className="mt-1 leading-6 text-app-text-muted">
                {highlight.summary}
              </p>
            </div>
            <Badge tone="neutral">근거 {highlight.evidenceCount}건</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
