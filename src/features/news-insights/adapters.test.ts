import {
  adaptNewsEvent,
  adaptNewsOverview,
  adaptNewsTopicDetail,
  adaptNewsTopicEvidence,
  adaptNewsTopicMap,
  adaptNewsTopicTrend,
} from './adapters'
import type {
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicMapDto,
  NewsTopicTrendDto,
} from './dto'

const overviewDto: NewsInsightOverviewDto = {
  as_of: '2026-07-21T06:00:00Z',
  summary: {
    high_importance_events: { count: 12, change: 3 },
    sentiment_shifts: { count: 7, change: -2 },
    active_topic_clusters: { count: 18, change: 4 },
    fund_flow_signals: { count: 5, change: 1 },
  },
  briefing: {
    summary: ' 시장 요약 ',
    highlights: [
      {
        text: ' 근거 기반 문장 ',
        topic_id: 7,
        evidence_count: 2,
        evidence_event_ids: [10, 11],
      },
    ],
    generated_at: '2026-07-21T05:50:00Z',
  },
}

const eventDto: NewsInsightEventDto = {
  id: 10,
  event_type: 'SUPPLY_CONTRACT',
  document_type: 'DISCLOSURE',
  symbol: ' 005930 ',
  title: ' 공급 계약 체결 ',
  summary: ' 계약 요약 ',
  importance: { level: 'HIGH', score: 1.2 },
  sentiment: { direction: 'POSITIVE', score: 0.824 },
  source: { name: ' DART ', reliability: 0.98 },
  published_at: '2026-07-21T00:42:00Z',
  evidence_count: 4,
  topic_ids: [7],
}

const topicMapDto: NewsTopicMapDto = {
  nodes: [
    {
      id: 'topic:7',
      label: '반도체 장기 수요 회복',
      type: 'TOPIC',
      mention_count: 12,
      momentum_score: 0.81,
      sentiment_score: 0.76,
      category: 'DEMAND',
    },
    {
      id: 'keyword:3',
      label: 'AI 반도체',
      type: 'KEYWORD',
      mention_count: 6,
      momentum_score: 0.84,
      sentiment_score: 0.74,
      category: 'GROWTH',
    },
  ],
  edges: [
    {
      source: 'keyword:2',
      target: 'keyword:3',
      strength: 0.86,
      cooccurrence_count: 5,
    },
  ],
}

const topicDetailDto: NewsTopicDetailDto = {
  title: ' 반도체 장기 수요 회복 ',
  tags: [' AI ', 'HBM'],
  lifecycle: 'RISING',
  scores: {
    impact: 0.91,
    sentiment: 0.73,
    confidence: 0.88,
    momentum: 0.82,
  },
  affected_symbols: [
    {
      symbol: ' 005930 ',
      exposure_score: 0.91,
      impact_direction: 'POSITIVE',
      relationship: 'DIRECT',
    },
  ],
  insight: {
    summary: ' 수요 회복 요약 ',
    why_it_matters: ' 공급 가시성이 높아진다. ',
    key_evidence: [{ event_id: 10 }],
    risk_points: [' 계약 지연 '],
    counter_arguments: [' 단기 실적 영향은 제한적이다. '],
  },
  version: 2,
  updated_at: '2026-07-21T06:00:00Z',
}

const topicTrendDto: NewsTopicTrendDto = {
  points: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      mention_count: 12,
      sentiment_score: 0.73,
      impact_score: 0.91,
    },
  ],
  markers: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      label: ' 공급 계약 ',
      event_id: 10,
    },
  ],
  source_distribution: [{ source_type: 'DISCLOSURE', count: 3, share: 0.75 }],
}

const topicEvidenceDto: NewsTopicEvidenceItemDto = {
  event_id: 10,
  document_id: 20,
  evidence_role: 'CONTRADICTING',
  document_type: 'NEWS',
  symbol: ' 005930 ',
  title: ' 반대 근거 기사 ',
  summary: ' AI 요약 ',
  direction: 'NEGATIVE',
  relevance_score: 0.846,
  source: ' Reuters ',
  published_at: '2026-07-21T00:00:00Z',
}

describe('news insights adapters', () => {
  it('maps overview DTO fields to display metrics and grounded briefing', () => {
    const result = adaptNewsOverview(overviewDto)

    expect(result.metrics).toEqual([
      expect.objectContaining({
        id: 'high-importance-events',
        label: '고중요 이벤트',
        count: 12,
        change: 3,
      }),
      expect.objectContaining({ label: '감성 급변', count: 7, change: -2 }),
      expect.objectContaining({ label: '활성 토픽 클러스터', count: 18 }),
      expect.objectContaining({ label: '자금 흐름 시그널', count: 5 }),
    ])
    expect(result.briefing.summary).toBe('시장 요약')
    expect(result.briefing.highlights[0]).toEqual(
      expect.objectContaining({
        text: '근거 기반 문장',
        topicId: 7,
        evidenceCount: 2,
        evidenceEventIds: [10, 11],
      }),
    )
  })

  it('maps importance and sentiment independently and clamps scores', () => {
    const result = adaptNewsEvent(eventDto)

    expect(result.importance).toEqual({
      label: '높음',
      tone: 'danger',
      scorePercent: 100,
    })
    expect(result.sentiment).toEqual({
      label: '긍정',
      tone: 'success',
      scorePercent: 82,
    })
    expect(result.documentTypeLabel).toBe('공시')
    expect(result.eventTypeLabel).toBe('공급 계약')
    expect(result.symbol).toBe('005930')
    expect(result.sourceName).toBe('DART')
  })

  it('uses safe display fallbacks for unknown or malformed wire values', () => {
    const result = adaptNewsEvent({
      ...eventDto,
      event_type: 'NEW_EVENT_TYPE',
      document_type: null,
      symbol: null,
      title: ' ',
      importance: { level: 'EXTREME', score: Number.NaN },
      sentiment: { direction: 'UNCLEAR', score: -1 },
      source: null,
      published_at: 'invalid',
      evidence_count: -3,
    })

    expect(result).toEqual(
      expect.objectContaining({
        eventTypeLabel: '기타 이벤트',
        documentTypeLabel: '문서 미상',
        symbol: '시장',
        title: '제목 없음',
        sourceName: '출처 미상',
        publishedAt: '시각 미상',
        evidenceCount: 0,
      }),
    )
    expect(result.importance).toEqual({
      label: '알 수 없음',
      tone: 'neutral',
      scorePercent: 0,
    })
    expect(result.sentiment).toEqual({
      label: '알 수 없음',
      tone: 'neutral',
      scorePercent: 0,
    })
  })

  it('maps every backend topic-map node and edge without recomputing relations', () => {
    const result = adaptNewsTopicMap(topicMapDto)

    expect(result.nodes).toEqual([
      {
        id: 'topic:7',
        label: '반도체 장기 수요 회복',
        type: 'TOPIC',
        mentionCount: 12,
        momentumScore: 0.81,
        sentimentScore: 0.76,
        category: 'DEMAND',
      },
      {
        id: 'keyword:3',
        label: 'AI 반도체',
        type: 'KEYWORD',
        mentionCount: 6,
        momentumScore: 0.84,
        sentimentScore: 0.74,
        category: 'GROWTH',
      },
    ])
    expect(result.edges).toEqual([
      {
        source: 'keyword:2',
        target: 'keyword:3',
        strength: 0.86,
        cooccurrenceCount: 5,
      },
    ])
  })

  it('maps topic detail scores, affected symbols, and counter arguments', () => {
    const result = adaptNewsTopicDetail(topicDetailDto)

    expect(result.title).toBe('반도체 장기 수요 회복')
    expect(result.lifecycle).toEqual({ label: '상승', tone: 'accent' })
    expect(result.scores[0]).toEqual(
      expect.objectContaining({ label: '종합 영향도', valuePercent: 91 }),
    )
    expect(result.affectedSymbols[0]).toEqual(
      expect.objectContaining({ symbol: '005930', exposurePercent: 91 }),
    )
    expect(result.insight.keyEvidence[0].label).toBe('이벤트 #10')
    expect(result.insight.counterArguments).toEqual([
      '단기 실적 영향은 제한적이다.',
    ])
  })

  it('maps trend values and server-computed source distribution unchanged', () => {
    const result = adaptNewsTopicTrend(topicTrendDto)

    expect(result.points[0]).toEqual(
      expect.objectContaining({
        mentionCount: 12,
        sentimentScore: 0.73,
        impactScore: 0.91,
      }),
    )
    expect(result.markers[0]).toEqual(
      expect.objectContaining({ label: '공급 계약', eventId: '10' }),
    )
    expect(result.sourceDistribution[0]).toEqual(
      expect.objectContaining({
        sourceTypeLabel: '공시',
        count: 3,
        sharePercent: 75,
      }),
    )
  })

  it('maps evidence fact labels separately from its AI summary', () => {
    const result = adaptNewsTopicEvidence(topicEvidenceDto)

    expect(result).toEqual(
      expect.objectContaining({
        id: '10-20',
        title: '반대 근거 기사',
        summary: 'AI 요약',
        symbol: '005930',
        relevancePercent: 85,
        source: 'Reuters',
      }),
    )
    expect(result.evidenceRole.label).toBe('반대 근거')
    expect(result.direction.label).toBe('부정')
  })

  it('preserves empty topic insight, trend, and evidence collections', () => {
    expect(
      adaptNewsTopicDetail({
        ...topicDetailDto,
        affected_symbols: [],
        insight: {
          ...topicDetailDto.insight,
          key_evidence: [],
          risk_points: [],
          counter_arguments: [],
        },
      }).insight.counterArguments,
    ).toEqual([])
    expect(
      adaptNewsTopicTrend({
        points: [],
        markers: [],
        source_distribution: [],
      }),
    ).toEqual({ points: [], markers: [], sourceDistribution: [] })
  })
})
