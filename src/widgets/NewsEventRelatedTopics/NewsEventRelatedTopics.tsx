import { generatePath, useNavigate } from 'react-router-dom'

import type { NewsEventDetailView } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Button, Card, EmptyState } from '@/shared/ui'

interface NewsEventRelatedTopicsProps {
  topics: NewsEventDetailView['relatedTopics']
}

export function NewsEventRelatedTopics({
  topics,
}: NewsEventRelatedTopicsProps) {
  const navigate = useNavigate()

  return (
    <Card aria-labelledby="news-event-topics-title" className="p-0">
      <div className="p-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
          Related topics
        </p>
        <h2
          id="news-event-topics-title"
          className="mt-1 text-xl font-semibold text-app-text"
        >
          관련 토픽
        </h2>
      </div>
      {topics.length === 0 ? (
        <EmptyState
          title="표시할 관련 토픽이 없습니다"
          description="이벤트와 연결된 토픽이 생기면 상세 링크를 표시합니다."
        />
      ) : (
        <ul className="divide-y divide-app-border border-t border-app-border">
          {topics.map((topic) => (
            <li
              key={topic.topicId}
              className="flex flex-wrap items-center justify-between gap-3 p-panel"
            >
              <div>
                <h3 className="font-semibold text-app-text">{topic.title}</h3>
                <p className="mt-1 text-xs text-app-text-muted">
                  토픽 #{topic.topicId}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  void navigate(
                    generatePath(appRoutePaths.newsTopicDetail, {
                      topicId: topic.topicId,
                    }),
                  )
                }
              >
                토픽 상세 보기
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
