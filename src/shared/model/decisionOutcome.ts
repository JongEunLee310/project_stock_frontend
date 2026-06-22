export const decisionOutcomes = ['진행 중', '대기', '리서치 중'] as const

export type DecisionOutcome = (typeof decisionOutcomes)[number]
