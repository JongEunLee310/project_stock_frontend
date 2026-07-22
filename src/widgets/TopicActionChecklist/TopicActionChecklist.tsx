import { generatePath, useNavigate } from 'react-router-dom'

import type { NewsTopicDetailView } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Badge, Button, Card } from '@/shared/ui'

interface TopicActionChecklistProps {
  topicId: string
  affectedSymbols: NewsTopicDetailView['affectedSymbols']
}

const availableActions = [
  {
    id: 'portfolio',
    title: '포트폴리오 영향 확인',
    description: '현재 보유 자산과 토픽의 영향 종목을 함께 점검합니다.',
    buttonLabel: '포트폴리오 보기',
    route: appRoutePaths.portfolio,
  },
  {
    id: 'decision-log',
    title: '판단 기록 연결',
    description: '확인한 근거와 투자 판단을 판단 기록에 남깁니다.',
    buttonLabel: '판단 기록 보기',
    route: appRoutePaths.decisionLog,
  },
  {
    id: 'alerts',
    title: '변화 알림 생성',
    description: '토픽과 관련된 변화를 추적할 알림 관리 화면으로 이동합니다.',
    buttonLabel: '알림 만들기',
    route: appRoutePaths.alerts,
  },
] as const

const plannedActions = [
  {
    id: 'follow',
    title: '관심 토픽 팔로우',
    description: '팔로우 상태를 저장할 서버 API가 준비되면 연결합니다.',
  },
  {
    id: 'compare',
    title: '유사 토픽·버전 비교',
    description:
      '과거 유사 사례와 인사이트 버전을 비교할 서버 기능을 준비 중입니다.',
  },
] as const

export function TopicActionChecklist({
  topicId,
  affectedSymbols,
}: TopicActionChecklistProps) {
  const navigate = useNavigate()
  const firstAffectedSymbol = affectedSymbols[0]?.symbol

  return (
    <Card
      aria-labelledby="topic-action-checklist-title"
      className="overflow-hidden p-0"
    >
      <div className="p-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
          Next actions
        </p>
        <h2
          id="topic-action-checklist-title"
          className="mt-1 text-xl font-semibold text-app-text"
        >
          액션 체크리스트
        </h2>
        <p className="mt-1 text-sm leading-6 text-app-text-muted">
          토픽 {topicId || '식별자 없음'}의 근거 확인 후 실행할 다음 행동을
          점검합니다.
        </p>
      </div>

      <ul className="divide-y divide-app-border border-t border-app-border">
        <li className="p-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-app-text">
                  관련 종목 리서치 열기
                </h3>
                <Badge tone={firstAffectedSymbol ? 'info' : 'neutral'}>
                  {firstAffectedSymbol ? '이동 가능' : '종목 없음'}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-app-text-muted">
                {firstAffectedSymbol
                  ? `첫 영향 종목 ${firstAffectedSymbol}의 리서치를 확인합니다.`
                  : '서버가 연결한 영향 종목이 없어 이동할 수 없습니다.'}
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={!firstAffectedSymbol}
              onClick={() => {
                if (!firstAffectedSymbol) return
                void navigate(
                  generatePath(appRoutePaths.researchDetail, {
                    symbol: firstAffectedSymbol,
                  }),
                )
              }}
            >
              리서치 보기
            </Button>
          </div>
        </li>

        {availableActions.map((action) => (
          <li key={action.id} className="p-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-app-text">
                    {action.title}
                  </h3>
                  <Badge tone="info">이동 가능</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-app-text-muted">
                  {action.description}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => void navigate(action.route)}
              >
                {action.buttonLabel}
              </Button>
            </div>
          </li>
        ))}

        {plannedActions.map((action) => (
          <li key={action.id} className="p-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-app-text">
                    {action.title}
                  </h3>
                  <Badge tone="neutral">준비 중</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-app-text-muted">
                  {action.description}
                </p>
              </div>
              <Button variant="secondary" disabled title="준비 중">
                준비 중
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
