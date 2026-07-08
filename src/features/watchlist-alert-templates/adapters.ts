import type { WatchlistAlertTemplateDto } from './dto'

export interface WatchlistAlertTemplateView {
  templateType: string
  label: string
  conditionDescription: string
  isActive: boolean
}

export const TEMPLATE_VISUAL_MAP: Record<
  string,
  { icon: string; activeClassName: string }
> = {
  PRICE_SPIKE: {
    icon: '±',
    activeClassName: 'border-amber-400/70 bg-amber-500/15 text-amber-100',
  },
  NEWS_RISK_HIGH: {
    icon: '▣',
    activeClassName: 'border-rose-400/70 bg-rose-500/15 text-rose-100',
  },
  AI_JUDGMENT_CHANGE: {
    icon: '⊙',
    activeClassName: 'border-blue-400/70 bg-blue-500/15 text-blue-100',
  },
  THEME_OVERHEAT: {
    icon: '↑',
    activeClassName: 'border-orange-400/70 bg-orange-500/15 text-orange-100',
  },
}

export function adaptWatchlistAlertTemplate(
  dto: WatchlistAlertTemplateDto,
): WatchlistAlertTemplateView {
  return {
    templateType: dto.template_type,
    label: dto.label,
    conditionDescription: dto.condition_description,
    isActive: dto.is_active,
  }
}

export function adaptWatchlistAlertTemplates(
  dtos: WatchlistAlertTemplateDto[],
): WatchlistAlertTemplateView[] {
  return dtos.map((dto) => adaptWatchlistAlertTemplate(dto))
}
