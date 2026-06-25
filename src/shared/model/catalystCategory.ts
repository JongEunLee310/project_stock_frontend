export const catalystCategories = ['이벤트', '실적', '제품', '공급'] as const

export type CatalystCategory = (typeof catalystCategories)[number]
