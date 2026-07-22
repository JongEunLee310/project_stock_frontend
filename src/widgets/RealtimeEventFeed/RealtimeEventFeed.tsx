import {
  Badge,
  Card,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'

type EventImportance = '높음' | '중간' | '낮음'
type EventSentiment = '긍정' | '중립' | '부정'
type EventCategory = '공시' | '산업' | '거시경제'

interface MarketEvent {
  id: string
  category: EventCategory
  symbol: string
  title: string
  importance: EventImportance
  sentiment: EventSentiment
  source: string
  occurredAt: string
  evidenceCount: number
}

const realtimeEvents: MarketEvent[] = [
  {
    id: 'event-1',
    category: '공시',
    symbol: '005930',
    title: '삼성전자, 차세대 HBM 공급 확대 계획 발표',
    importance: '높음',
    sentiment: '긍정',
    source: 'DART',
    occurredAt: '09:42',
    evidenceCount: 4,
  },
  {
    id: 'event-2',
    category: '산업',
    symbol: 'NVDA',
    title: 'AI 가속기 공급 일정 조정 가능성 부각',
    importance: '중간',
    sentiment: '부정',
    source: 'Reuters',
    occurredAt: '09:31',
    evidenceCount: 6,
  },
  {
    id: 'event-3',
    category: '거시경제',
    symbol: '시장',
    title: '미 국채 금리 보합권, 성장주 영향 제한적',
    importance: '낮음',
    sentiment: '중립',
    source: '연합인포맥스',
    occurredAt: '09:18',
    evidenceCount: 3,
  },
]

const categoryTones: Record<EventCategory, BadgeTone> = {
  공시: 'info',
  산업: 'accent',
  거시경제: 'neutral',
}

const importanceTones: Record<EventImportance, BadgeTone> = {
  높음: 'danger',
  중간: 'warning',
  낮음: 'success',
}

const sentimentTones: Record<EventSentiment, BadgeTone> = {
  긍정: 'success',
  중립: 'neutral',
  부정: 'danger',
}

const eventColumns: Array<TableColumn<MarketEvent>> = [
  {
    key: 'category',
    header: '분류',
    cell: (event) => (
      <Badge tone={categoryTones[event.category]}>{event.category}</Badge>
    ),
  },
  {
    key: 'symbol',
    header: '종목',
    cell: (event) => (
      <strong className="text-cockpit-text">{event.symbol}</strong>
    ),
  },
  {
    key: 'title',
    header: '이벤트 요약',
    className: 'min-w-64',
    cell: (event) => event.title,
  },
  {
    key: 'importance',
    header: '중요도',
    cell: (event) => (
      <Badge tone={importanceTones[event.importance]}>
        중요도 {event.importance}
      </Badge>
    ),
  },
  {
    key: 'sentiment',
    header: '감성',
    cell: (event) => (
      <Badge tone={sentimentTones[event.sentiment]}>
        감성 {event.sentiment}
      </Badge>
    ),
  },
  { key: 'source', header: '출처', cell: (event) => event.source },
  {
    key: 'occurredAt',
    header: '시각',
    cell: (event) => <time>{event.occurredAt}</time>,
  },
  {
    key: 'evidence',
    header: '근거',
    align: 'right',
    cell: (event) => `${event.evidenceCount}건`,
  },
]

export function RealtimeEventFeed() {
  return (
    <Card aria-labelledby="realtime-event-feed-title" className="p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Event feed
          </p>
          <h2
            id="realtime-event-feed-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            실시간 이벤트 피드
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            관련 문서를 하나의 시장 이벤트로 묶어 중요도와 감성을 분리했습니다.
          </p>
        </div>
        <span className="text-xs text-app-text-muted">2분 전</span>
      </div>
      <Table
        aria-label="실시간 이벤트 목록"
        className="rounded-none border-x-0 border-b-0"
        columns={eventColumns}
        rows={realtimeEvents}
        getRowKey={(event) => event.id}
      />
    </Card>
  )
}
