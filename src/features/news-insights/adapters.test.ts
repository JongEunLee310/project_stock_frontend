import {
  adaptNewsAgentRuns,
  adaptNewsCalendar,
  adaptNewsEvent,
  adaptNewsEventDetail,
  adaptNewsFundFlowOutlook,
  adaptNewsInvestorFlows,
  adaptNewsOverview,
  adaptNewsTopicDetail,
  adaptNewsTopicEvidence,
  adaptNewsTopicExplanation,
  adaptNewsTopicGraph,
  adaptNewsTopicMap,
  adaptNewsTopicScenarios,
  adaptNewsTopicSymbols,
  adaptNewsTopicTrend,
} from './adapters'
import type {
  NewsAgentRunsDto,
  NewsCalendarItemDto,
  NewsEventDetailDto,
  NewsFundFlowOutlookDto,
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsInvestorFlowsDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicExplanationDto,
  NewsTopicGraphDto,
  NewsTopicMapDto,
  NewsTopicScenariosDto,
  NewsTopicSymbolSensitivityItemDto,
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

const calendarDto: NewsCalendarItemDto[] = [
  {
    scheduled_at: '2026-07-25T00:00:00Z',
    event_kind: 'EARNINGS',
    title: ' 분기 실적 발표 ',
    symbol: ' 005930 ',
    market: ' KR ',
    importance: 0.86,
    related_topic_ids: [7, 9],
  },
]

const agentRunsDto: NewsAgentRunsDto = {
  last_processed_at: '2026-07-21T06:00:00Z',
  processed_documents: 1200,
  extracted_events: 48,
  active_topics: 12,
  stages: [
    { name: 'COLLECT', status: 'COMPLETED', delayed: false },
    { name: 'EXTRACT', status: 'DELAYED', delayed: true },
  ],
  analysis_version: ' v3.2 ',
  has_delay: true,
}

const investorFlowsDto: NewsInvestorFlowsDto = {
  as_of: '2026-07-21T06:00:00Z',
  by_investor_type: [
    {
      investor_type: 'FOREIGN',
      net_value: '1234567890.12',
      direction: 'BUY',
      change: 0.125,
    },
    {
      investor_type: 'INSTITUTION',
      net_value: '-420000000.50',
      direction: 'SELL',
      change: -0.04,
    },
  ],
  narrative_alignment: {
    aligned: false,
    note: ' 긍정 뉴스와 달리 기관은 순매도입니다. ',
  },
  availability: { available: true, fallback: null },
}

const fundFlowOutlookDto: NewsFundFlowOutlookDto = {
  as_of: '2026-07-21T06:00:00Z',
  analysis_version: ' v3.1 ',
  items: [
    {
      sector: ' 반도체 ',
      direction: 'INFLOW',
      likelihood: 'HIGH',
      estimated_range: ' 1,000억~1,500억원 ',
      horizon: ' 1개월 ',
      confidence: 0.824,
      key_assumptions: [' AI 수요가 유지됩니다. '],
      risk_factors: [' 공급 차질 가능성이 있습니다. '],
    },
  ],
}

const topicScenariosDto: NewsTopicScenariosDto = {
  topic_id: 7,
  analysis_version: ' v3.1 ',
  as_of: '2026-07-21T06:00:00Z',
  scenarios: [
    {
      scenario_kind: 'BASE',
      weight: 0.5,
      expected_flow_direction: 'NEUTRAL',
      key_assumptions: [' 수요가 현재 수준을 유지합니다. '],
      benefiting_sectors: [' 반도체 '],
      risk_sectors: [' 유통 '],
      related_symbols: [' NVDA '],
      invalidation_conditions: [' 주문이 20% 이상 감소합니다. '],
    },
  ],
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

const eventDetailDto: NewsEventDetailDto = {
  event_type: 'SUPPLY_CONTRACT',
  title: ' AI 반도체 공급 계약 ',
  summary: ' 이벤트 레벨 AI 요약 ',
  importance: {
    level: 'HIGH',
    score: 0.91,
    explanation: ' 공급 가시성이 높아졌습니다. ',
  },
  sentiment: { direction: 'POSITIVE', score: 0.82 },
  affected_symbols: [
    {
      symbol: ' NVDA ',
      direction: 'POSITIVE',
      exposure_score: 0.88,
      reason: ' 매출 증가 가능성 ',
    },
  ],
  evidence: [
    {
      document_id: 20,
      document_type: 'DISCLOSURE',
      source: ' DART ',
      title: ' 공급 계약 공시 ',
      published_at: '2026-07-21T00:00:00Z',
      evidence_role: 'PRIMARY',
    },
  ],
  related_topics: [{ topic_id: 7, title: ' AI 반도체 수요 ' }],
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

const topicExplanationDto: NewsTopicExplanationDto = {
  factors: [
    { label: ' 수요 증가 ', contribution_ratio: 0.425 },
    { label: ' 공급 제약 ', contribution_ratio: 0.575 },
  ],
  meta: {
    analysis_version: ' v3.2 ',
    data_coverage: 0.86,
    last_updated: '2026-07-21T06:00:00Z',
    missing_data: [' 해외 비공개 주문 '],
    counter_argument_count: 2,
    confidence: 0.81,
    limitations: [' 단기 표본 중심 '],
  },
  counter_view: {
    counter_arguments: [' 밸류에이션 부담 '],
    invalidation_conditions: [' 주문 감소 '],
    already_priced_in: { likely: true, note: ' 주가에 일부 반영됨 ' },
    contradicting_evidence: [
      {
        event_id: 30,
        document_id: 40,
        title: ' 수요 둔화 기사 ',
        source: ' Reuters ',
        published_at: '2026-07-21T00:00:00Z',
      },
    ],
  },
}

const topicSymbolsDto: NewsTopicSymbolSensitivityItemDto[] = [
  {
    symbol: ' NVDA ',
    exposure_score: 0.824,
    impact_direction: 'POSITIVE',
    relationship: 'DIRECT',
    valuation_burden: 'HIGH',
    portfolio_weight: 0.125,
    current_signal: 'OVERHEATED',
  },
  {
    symbol: 'TSM',
    exposure_score: 0.61,
    impact_direction: 'MIXED',
    relationship: 'SUPPLY_CHAIN',
    valuation_burden: null,
    portfolio_weight: null,
    current_signal: null,
  },
]

const topicGraphDto: NewsTopicGraphDto = {
  nodes: [
    {
      id: 'keyword:ai-chip',
      label: ' AI 반도체 ',
      type: 'KEYWORD',
      mention_count: 17,
      sentiment_score: 0.78,
      related_event_ids: [101, 102],
      related_symbols: ['NVDA', 'TSM'],
    },
  ],
  edges: [
    {
      source: 'keyword:ai-chip',
      target: 'keyword:hbm',
      strength: 0.86,
      cooccurrence_count: 9,
    },
  ],
}

describe('news insights adapters', () => {
  it('maps calendar event presentation while preserving its scheduled timestamp', () => {
    const result = adaptNewsCalendar(calendarDto)

    expect(result[0]).toEqual({
      scheduledAt: '2026-07-25T00:00:00Z',
      scheduledAtLabel: expect.any(String),
      eventKind: 'EARNINGS',
      eventKindPresentation: { label: '실적 발표', tone: 'accent' },
      title: '분기 실적 발표',
      symbol: '005930',
      market: 'KR',
      importancePercent: 86,
      importancePresentation: { label: '중요도 높음', tone: 'danger' },
      relatedTopicIds: ['7', '9'],
    })
    expect(adaptNewsCalendar([])).toEqual([])
  })

  it('maps only verifiable agent stages and aggregate values', () => {
    const result = adaptNewsAgentRuns(agentRunsDto)

    expect(result).toEqual(
      expect.objectContaining({
        processedDocuments: 1200,
        extractedEvents: 48,
        activeTopics: 12,
        analysisVersion: 'v3.2',
        hasDelay: true,
      }),
    )
    expect(result.stages).toEqual([
      {
        name: 'COLLECT',
        namePresentation: { label: '수집', tone: 'info' },
        status: 'COMPLETED',
        statusPresentation: { label: '완료', tone: 'success' },
        delayed: false,
      },
      {
        name: 'EXTRACT',
        namePresentation: { label: '이벤트 추출', tone: 'accent' },
        status: 'DELAYED',
        statusPresentation: { label: '지연', tone: 'warning' },
        delayed: true,
      },
    ])
    expect(adaptNewsAgentRuns({ ...agentRunsDto, stages: [] }).stages).toEqual(
      [],
    )
  })

  it('preserves backend contribution ratios and adapts explanation metadata', () => {
    const result = adaptNewsTopicExplanation(topicExplanationDto)

    expect(result.factors).toEqual([
      { label: '수요 증가', contributionRatio: 0.425 },
      { label: '공급 제약', contributionRatio: 0.575 },
    ])
    expect(result.meta).toEqual(
      expect.objectContaining({
        analysisVersion: 'v3.2',
        dataCoveragePercent: 86,
        missingData: ['해외 비공개 주문'],
        counterArgumentCount: 2,
        confidencePercent: 81,
        limitations: ['단기 표본 중심'],
      }),
    )
    expect(result.counterView).toEqual(
      expect.objectContaining({
        counterArguments: ['밸류에이션 부담'],
        invalidationConditions: ['주문 감소'],
        alreadyPricedIn: { likely: true, note: '주가에 일부 반영됨' },
        contradictingEvidence: [
          expect.objectContaining({
            id: '30-40',
            title: '수요 둔화 기사',
            source: 'Reuters',
          }),
        ],
      }),
    )
  })

  it('preserves empty explanation collections without creating factors', () => {
    const result = adaptNewsTopicExplanation({
      ...topicExplanationDto,
      factors: [],
      counter_view: {
        counter_arguments: [],
        invalidation_conditions: [],
        already_priced_in: { likely: false, note: null },
        contradicting_evidence: [],
      },
    })

    expect(result.factors).toEqual([])
    expect(result.counterView.counterArguments).toEqual([])
    expect(result.counterView.contradictingEvidence).toEqual([])
  })

  it('maps fund-flow outlook levels and keeps the server range with grounded sentences', () => {
    const result = adaptNewsFundFlowOutlook(fundFlowOutlookDto)

    expect(result).toEqual({
      asOf: expect.any(String),
      analysisVersion: 'v3.1',
      items: [
        {
          sector: '반도체',
          direction: { label: '유입 방향', tone: 'success' },
          likelihood: { label: '높음', tone: 'success' },
          estimatedRange: '1,000억~1,500억원',
          horizon: '1개월',
          confidencePercent: 82,
          keyAssumptions: ['AI 수요가 유지됩니다.'],
          riskFactors: ['공급 차질 가능성이 있습니다.'],
        },
      ],
    })
  })

  it('maps scenario weight as a display level and preserves empty response data', () => {
    const result = adaptNewsTopicScenarios(topicScenariosDto)

    expect(result.scenarios[0]).toEqual({
      kind: 'BASE',
      kindPresentation: { label: '기준', tone: 'info' },
      weightPercent: 50,
      direction: { label: '중립 방향', tone: 'neutral' },
      keyAssumptions: ['수요가 현재 수준을 유지합니다.'],
      benefitingSectors: ['반도체'],
      riskSectors: ['유통'],
      relatedSymbols: ['NVDA'],
      invalidationConditions: ['주문이 20% 이상 감소합니다.'],
    })
    expect(
      adaptNewsTopicScenarios({ ...topicScenariosDto, scenarios: [] })
        .scenarios,
    ).toEqual([])
    expect(
      adaptNewsFundFlowOutlook({ ...fundFlowOutlookDto, items: [] }).items,
    ).toEqual([])
  })

  it('preserves decimal flow values and maps investor and direction presentations', () => {
    const result = adaptNewsInvestorFlows(investorFlowsDto)

    expect(result.byInvestorType[0]).toEqual({
      investorType: 'FOREIGN',
      investor: { label: '외국인', tone: 'info' },
      netValue: '1234567890.12',
      direction: 'BUY',
      directionPresentation: { label: '순매수', tone: 'success' },
      change: 0.125,
    })
    expect(result.byInvestorType[1]).toEqual(
      expect.objectContaining({
        investor: { label: '기관', tone: 'accent' },
        directionPresentation: { label: '순매도', tone: 'danger' },
      }),
    )
    expect(result.narrativeAlignment).toEqual({
      aligned: false,
      note: '긍정 뉴스와 달리 기관은 순매도입니다.',
    })
  })

  it('preserves unavailable and empty investor flow responses without estimates', () => {
    const result = adaptNewsInvestorFlows({
      ...investorFlowsDto,
      by_investor_type: [],
      availability: {
        available: false,
        fallback: ' ETF 자금 흐름을 참고하세요. ',
      },
    })

    expect(result.byInvestorType).toEqual([])
    expect(result.availability).toEqual({
      available: false,
      fallback: 'ETF 자금 흐름을 참고하세요.',
    })
  })

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

  it('maps an event detail without inventing per-document summaries', () => {
    const result = adaptNewsEventDetail(eventDetailDto)

    expect(result).toEqual(
      expect.objectContaining({
        eventTypeLabel: '공급 계약',
        title: 'AI 반도체 공급 계약',
        summary: '이벤트 레벨 AI 요약',
      }),
    )
    expect(result.importance).toEqual({
      label: '높음',
      tone: 'danger',
      scorePercent: 91,
      explanation: '공급 가시성이 높아졌습니다.',
    })
    expect(result.sentiment).toEqual({
      label: '긍정',
      tone: 'success',
      scorePercent: 82,
    })
    expect(result.affectedSymbols[0]).toEqual(
      expect.objectContaining({
        symbol: 'NVDA',
        exposurePercent: 88,
        reason: '매출 증가 가능성',
      }),
    )
    expect(result.evidence[0]).toEqual(
      expect.objectContaining({
        documentId: '20',
        source: 'DART',
        title: '공급 계약 공시',
      }),
    )
    expect(result.evidence[0]).not.toHaveProperty('summary')
    expect(result.relatedTopics).toEqual([
      { topicId: '7', title: 'AI 반도체 수요' },
    ])
  })

  it('preserves empty event detail collections', () => {
    const result = adaptNewsEventDetail({
      ...eventDetailDto,
      affected_symbols: [],
      evidence: [],
      related_topics: [],
    })

    expect(result.affectedSymbols).toEqual([])
    expect(result.evidence).toEqual([])
    expect(result.relatedTopics).toEqual([])
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
    expect(result.scores[1]).toEqual(
      expect.objectContaining({
        label: '감성 방향',
        valuePercent: 73,
        direction: {
          label: '긍정',
          trendLabel: '상승',
          indicator: '↗',
        },
      }),
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

  it('maps symbol exposure, direction, relationship, and nullable fields independently', () => {
    const result = adaptNewsTopicSymbols(topicSymbolsDto)

    expect(result[0]).toEqual({
      symbol: 'NVDA',
      exposurePercent: 82,
      impactDirection: { label: '긍정', tone: 'success' },
      relationship: { label: '직접 영향', tone: 'info' },
      valuationBurden: { label: '높음', tone: 'danger' },
      portfolioWeightPercent: 13,
      currentSignal: { label: '과열', tone: 'warning' },
    })
    expect(result[1]).toEqual(
      expect.objectContaining({
        valuationBurden: null,
        portfolioWeightPercent: null,
        currentSignal: null,
      }),
    )
  })

  it('maps graph nodes and edges without changing backend relationships', () => {
    const result = adaptNewsTopicGraph(topicGraphDto)

    expect(result.nodes[0]).toEqual({
      id: 'keyword:ai-chip',
      label: 'AI 반도체',
      type: 'KEYWORD',
      mentionCount: 17,
      sentimentScore: 0.78,
      sentiment: { label: '긍정', tone: 'success' },
      relatedEventIds: ['101', '102'],
      relatedSymbols: ['NVDA', 'TSM'],
    })
    expect(result.edges).toEqual([
      {
        source: 'keyword:ai-chip',
        target: 'keyword:hbm',
        strength: 0.86,
        cooccurrenceCount: 9,
      },
    ])
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
    expect(adaptNewsTopicSymbols([])).toEqual([])
    expect(adaptNewsTopicGraph({ nodes: [], edges: [] })).toEqual({
      nodes: [],
      edges: [],
    })
  })
})
