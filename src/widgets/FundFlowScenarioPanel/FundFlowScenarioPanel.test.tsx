import { render, screen } from '@testing-library/react'

import {
  type FundFlowScenarioView,
  type NewsTopicScenariosView,
  useNewsTopicScenariosQuery,
} from '@/features/news-insights'

import { FundFlowScenarioPanel } from './FundFlowScenarioPanel'

vi.mock('@/features/news-insights', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/news-insights')>()
  return { ...actual, useNewsTopicScenariosQuery: vi.fn() }
})

function scenario(
  kind: FundFlowScenarioView['kind'],
  label: string,
  weightPercent: number,
): FundFlowScenarioView {
  return {
    kind,
    kindPresentation: {
      label,
      tone: kind === 'OPTIMISTIC' ? 'success' : 'info',
    },
    weightPercent,
    direction: { label: '유입 방향', tone: 'success' },
    keyAssumptions: [`${label} 가정 문장`],
    benefitingSectors: ['반도체'],
    riskSectors: ['유통'],
    relatedSymbols: ['NVDA'],
    invalidationConditions: [`${label} 무효화 조건`],
  }
}

const scenarios: NewsTopicScenariosView = {
  topicId: '7',
  analysisVersion: 'v3.1',
  asOf: '2026. 7. 21. 오후 3:00',
  scenarios: [
    scenario('CONSERVATIVE', '보수', 20),
    scenario('OPTIMISTIC', '낙관', 30),
    scenario('BASE', '기준', 50),
  ],
}

function mockQuery(
  state: Partial<ReturnType<typeof useNewsTopicScenariosQuery>> = {},
) {
  vi.mocked(useNewsTopicScenariosQuery).mockReturnValue({
    data: scenarios,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useNewsTopicScenariosQuery>)
}

describe('FundFlowScenarioPanel', () => {
  beforeEach(() => mockQuery())

  it('renders three ordered conditional scenarios with weights and invalidation evidence', () => {
    render(<FundFlowScenarioPanel topicId="7" />)

    const headings = screen.getAllByRole('heading', {
      name: /낙관 시나리오|기준 시나리오|보수 시나리오/,
    })
    expect(headings.map((heading) => heading.textContent)).toEqual([
      '낙관 시나리오',
      '기준 시나리오',
      '보수 시나리오',
    ])
    expect(screen.getByText('현재 근거 기준 가중치 50%')).toBeVisible()
    expect(screen.getByText('기준 가정 문장')).toBeVisible()
    expect(screen.getByText('기준 무효화 조건')).toBeVisible()
    expect(screen.getAllByText('NVDA')).toHaveLength(3)
    expect(
      screen.getByRole('region', { name: '예상 자금 흐름 시나리오' }),
    ).toBeVisible()
    expect(
      screen.queryByText(/통계적 확률이나 확정 예측이 아닙니다/),
    ).not.toBeInTheDocument()
    expect(useNewsTopicScenariosQuery).toHaveBeenCalledWith('7')
  })

  it('isolates server and incomplete-contract errors and preserves empty state', () => {
    mockQuery({ data: undefined, isLoading: true })
    const { rerender } = render(<FundFlowScenarioPanel topicId="7" />)
    expect(
      screen.getByLabelText('예상 자금 흐름 시나리오 불러오는 중'),
    ).toBeVisible()

    mockQuery({ data: undefined, isLoading: false, isError: true })
    rerender(<FundFlowScenarioPanel topicId="7" />)
    expect(
      screen.getByText('예상 자금 흐름 시나리오를 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText(/아직 분석되지 않은 토픽/)).toBeVisible()

    mockQuery({
      data: { ...scenarios, scenarios: scenarios.scenarios.slice(0, 2) },
    })
    rerender(<FundFlowScenarioPanel topicId="7" />)
    expect(screen.getByText(/시나리오 구성이 완전하지 않습니다/)).toBeVisible()
    expect(screen.queryByText('낙관 가정 문장')).not.toBeInTheDocument()

    mockQuery({ data: { ...scenarios, scenarios: [] } })
    rerender(<FundFlowScenarioPanel topicId="7" />)
    expect(
      screen.getByText('표시할 자금 흐름 시나리오가 없습니다'),
    ).toBeVisible()
  })
})
