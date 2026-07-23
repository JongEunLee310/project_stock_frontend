import {
  type FundFlowScenarioView,
  type ScenarioKindDto,
  useNewsTopicScenariosQuery,
} from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

const scenarioOrder: ScenarioKindDto[] = ['OPTIMISTIC', 'BASE', 'CONSERVATIVE']

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-text-muted">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-6 text-app-text">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-app-text-muted">제공된 항목 없음</p>
      )}
    </div>
  )
}

function ChipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-text-muted">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <Badge key={`${item}-${index}`} tone="neutral">
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-app-text-muted">제공된 항목 없음</span>
        )}
      </div>
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: FundFlowScenarioView }) {
  return (
    <li className="border-t border-app-border py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-app-text">
          {scenario.kindPresentation.label} 시나리오
        </h3>
        <Badge tone={scenario.kindPresentation.tone}>
          {scenario.kindPresentation.label}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={scenario.direction.tone}>{scenario.direction.label}</Badge>
        <Badge tone="info">
          현재 근거 기준 가중치 {scenario.weightPercent}%
        </Badge>
      </div>
      <div className="mt-4 space-y-4 border-t border-app-border pt-4">
        <TextList title="주요 가정" items={scenario.keyAssumptions} />
        <ChipList title="수혜 가능 섹터" items={scenario.benefitingSectors} />
        <ChipList title="위험 섹터" items={scenario.riskSectors} />
        <ChipList title="관련 종목" items={scenario.relatedSymbols} />
        <TextList
          title="시나리오 무효화 조건"
          items={scenario.invalidationConditions}
        />
      </div>
    </li>
  )
}

function ScenarioLoading() {
  return (
    <div
      role="status"
      aria-label="예상 자금 흐름 시나리오 불러오는 중"
      className="grid gap-3 border-t border-app-border p-panel 2xl:grid-cols-3"
    >
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

function hasCompleteScenarioSet(scenarios: FundFlowScenarioView[]): boolean {
  const kinds = new Set(scenarios.map((scenario) => scenario.kind))
  return (
    scenarios.length === scenarioOrder.length &&
    scenarioOrder.every((kind) => kinds.has(kind))
  )
}

export function FundFlowScenarioPanel({ topicId }: { topicId: string }) {
  const scenariosQuery = useNewsTopicScenariosQuery(topicId)
  const scenarios = scenariosQuery.data?.scenarios ?? []
  const isIncomplete =
    scenarios.length > 0 && !hasCompleteScenarioSet(scenarios)
  const orderedScenarios = scenarioOrder.flatMap((kind) => {
    const scenario = scenarios.find((item) => item.kind === kind)
    return scenario ? [scenario] : []
  })

  return (
    <Card
      aria-labelledby="fund-flow-scenarios-title"
      className="overflow-hidden p-0"
    >
      <PanelHeader
        className="p-panel"
        title="예상 자금 흐름 시나리오"
        titleId="fund-flow-scenarios-title"
        controls={
          <>
            {scenariosQuery.data ? (
              <Badge tone="accent">
                분석 {scenariosQuery.data.analysisVersion}
              </Badge>
            ) : null}
            <PanelFreshness updatedAt={scenariosQuery.dataUpdatedAt} />
          </>
        }
      />

      {scenariosQuery.isLoading ? <ScenarioLoading /> : null}
      {scenariosQuery.isError || isIncomplete ? (
        <ErrorState
          title="예상 자금 흐름 시나리오를 불러오지 못했습니다"
          description={
            isIncomplete
              ? '낙관·기준·보수 시나리오 구성이 완전하지 않습니다.'
              : '아직 분석되지 않은 토픽일 수 있습니다. 다른 패널은 계속 확인할 수 있습니다.'
          }
          onRetry={() => void scenariosQuery.refetch()}
        />
      ) : null}
      {!scenariosQuery.isLoading &&
      !scenariosQuery.isError &&
      scenarios.length === 0 ? (
        <EmptyState
          title="표시할 자금 흐름 시나리오가 없습니다"
          description="토픽 분석이 완료되면 세 가지 조건부 시나리오를 표시합니다."
        />
      ) : null}
      {!scenariosQuery.isLoading &&
      !scenariosQuery.isError &&
      !isIncomplete &&
      orderedScenarios.length === scenarioOrder.length ? (
        <div className="space-y-4 border-t border-app-border p-panel">
          <ul className="grid gap-x-4 2xl:grid-cols-3">
            {orderedScenarios.map((scenario) => (
              <ScenarioCard key={scenario.kind} scenario={scenario} />
            ))}
          </ul>
          <p className="text-right text-xs text-app-text-muted">
            데이터 기준 {scenariosQuery.data?.asOf} · 분석 버전{' '}
            {scenariosQuery.data?.analysisVersion}
          </p>
        </div>
      ) : null}
    </Card>
  )
}
