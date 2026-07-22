import { generatePath, useNavigate } from 'react-router-dom'

import type { NewsEventDetailView } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Badge, Button, Card, EmptyState } from '@/shared/ui'

interface NewsEventAffectedSymbolsProps {
  symbols: NewsEventDetailView['affectedSymbols']
}

export function NewsEventAffectedSymbols({
  symbols,
}: NewsEventAffectedSymbolsProps) {
  const navigate = useNavigate()

  return (
    <Card aria-labelledby="news-event-symbols-title" className="p-0">
      <div className="p-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
          Market impact
        </p>
        <h2
          id="news-event-symbols-title"
          className="mt-1 text-xl font-semibold text-app-text"
        >
          영향 종목
        </h2>
      </div>
      {symbols.length === 0 ? (
        <EmptyState
          title="표시할 영향 종목이 없습니다"
          description="서버가 연결한 종목이 생기면 영향 방향과 노출도를 표시합니다."
        />
      ) : (
        <ul className="divide-y divide-app-border border-t border-app-border">
          {symbols.map((item) => (
            <li key={item.symbol} className="p-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-app-text">
                      {item.symbol}
                    </h3>
                    <Badge tone={item.direction.tone}>
                      영향 {item.direction.label}
                    </Badge>
                    <Badge tone="neutral">노출도 {item.exposurePercent}%</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-app-text-muted">
                    {item.reason || '제공된 영향 사유가 없습니다.'}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    void navigate(
                      generatePath(appRoutePaths.researchDetail, {
                        symbol: item.symbol,
                      }),
                    )
                  }
                >
                  {item.symbol} 리서치 보기
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
