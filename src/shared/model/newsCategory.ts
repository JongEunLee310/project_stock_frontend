export const newsCategories = ['실적', '제품', '파트너십', '규제'] as const

export type NewsCategory = (typeof newsCategories)[number]
