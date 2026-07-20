import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AlertEventDetail as AlertEventDetailModel } from '@/features/alerts/adapters'

import { AlertDetail } from './AlertDetail'

interface DetailQueryState {
  data: AlertEventDetailModel | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const detail: AlertEventDetailModel = {
  id: 71,
  ruleId: 11,
  userId: 7,
  targetType: 'SYMBOL',
  targetId: 'NVDA',
  assetId: 3,
  title: '가격 급등',
  message: '1일 등락률이 기준을 넘었습니다.',
  severity: 'HIGH',
  readAt: null,
  readAtIso: null,
  triggeredAt: '2026. 7. 20. 오후 12:30',
  triggeredAtIso: '2026-07-20T03:30:00Z',
  triggeredValue: {
    metric: 'PRICE_CHANGE_1D',
    current: 7.2,
    previous: 1.1,
    threshold: 5,
  },
  evidence: [
    {
      kind: 'PRICE',
      symbol: 'NVDA',
      current_close: 152.4,
      custom_note: '새 필드도 표시',
    },
  ],
}

let detailQueryState: DetailQueryState
const refetchDetail = vi.fn()

vi.mock('@/features/alerts/queries', () => ({
  useAlertEvent: () => detailQueryState,
}))

function setDetailQueryState(state: Partial<DetailQueryState>) {
  detailQueryState = {
    data: detail,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDetail,
    ...state,
  }
}

describe('AlertDetail', () => {
  beforeEach(() => {
    refetchDetail.mockReset()
    setDetailQueryState({})
  })

  it('renders a single triggered value and generic evidence fields', () => {
    render(<AlertDetail eventId={71} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '알림 상세' })).toBeVisible()
    expect(screen.getByText('1일 등락률')).toBeVisible()
    expect(screen.getByText('7.2')).toBeVisible()
    expect(screen.getByText('5')).toBeVisible()
    expect(screen.getByText('1.1')).toBeVisible()
    expect(screen.getByText('가격 근거')).toBeVisible()
    expect(screen.getByText('현재 종가')).toBeVisible()
    expect(screen.getByText('custom note')).toBeVisible()
    expect(screen.getByText('새 필드도 표시')).toBeVisible()
    expect(screen.getByText('종목 · NVDA')).toBeVisible()
  })

  it('renders composite triggered values and omits null previous values', () => {
    setDetailQueryState({
      data: {
        ...detail,
        triggeredValue: {
          conditions: [
            {
              metric: 'NEWS_RISK',
              current: 'HIGH',
              previous: null,
              threshold: 'HIGH',
            },
            {
              metric: 'POSITION_WEIGHT',
              current: 0.18,
              previous: 0.14,
              threshold: 0.15,
            },
          ],
        },
        evidence: [{ kind: 'NEW_KIND', arbitrary_value: 42 }],
      },
    })

    render(<AlertDetail eventId={71} onClose={vi.fn()} />)

    expect(screen.getByText('뉴스 위험도')).toBeVisible()
    expect(screen.getByText('단일 종목 비중')).toBeVisible()
    expect(screen.getByText('NEW_KIND')).toBeVisible()
    expect(screen.getByText('arbitrary value')).toBeVisible()
    expect(screen.getAllByText('이전값')).toHaveLength(1)
  })

  it('renders loading and retryable error states', () => {
    setDetailQueryState({ data: undefined, isLoading: true })
    const { rerender } = render(<AlertDetail eventId={71} onClose={vi.fn()} />)
    expect(screen.getByLabelText('알림 상세 불러오는 중')).toBeVisible()

    setDetailQueryState({
      data: undefined,
      error: new Error('Detail failed'),
      isError: true,
      isLoading: false,
    })
    rerender(<AlertDetail eventId={71} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(screen.getByText('Detail failed')).toBeVisible()
    expect(refetchDetail).toHaveBeenCalledTimes(1)
  })

  it('closes from the close button', () => {
    const onClose = vi.fn()
    render(<AlertDetail eventId={71} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
