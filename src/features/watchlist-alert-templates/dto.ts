export interface WatchlistAlertTemplateDto {
  template_type: string
  label: string
  condition_description: string
  is_active: boolean
}

export interface WatchlistAlertTemplateApplyDto {
  template_type: string
  is_active: boolean
}

export interface WatchlistAlertTemplateBulkRequestDto {
  templates: WatchlistAlertTemplateApplyDto[]
}
