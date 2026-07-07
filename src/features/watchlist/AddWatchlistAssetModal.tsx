import { useEffect, useId, useMemo, useState } from 'react'

import { Button, Input, Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

import type { AssetDto, CreateAssetBody } from './dto'
import {
  useAddAssetToFirstWatchlist,
  useAssetSearch,
  useCreateAsset,
} from './queries'

interface AddWatchlistAssetModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalMode = 'search' | 'create'

const searchDebounceMs = 350

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
}

function normalizeOptional(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function buildCreateAssetBody(form: CreateAssetBody): CreateAssetBody {
  return {
    symbol: form.symbol.trim().toUpperCase(),
    name: form.name.trim(),
    market: form.market.trim().toUpperCase(),
    sector: normalizeOptional(form.sector ?? ''),
    industry: normalizeOptional(form.industry ?? ''),
    description: normalizeOptional(form.description ?? ''),
  }
}

function AssetResultButton({
  asset,
  isSelected,
  onSelect,
}: {
  asset: AssetDto
  isSelected: boolean
  onSelect: (asset: AssetDto) => void
}) {
  return (
    <button
      type="button"
      className={classNames(
        'flex w-full items-start justify-between gap-3 rounded-control border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
        isSelected
          ? 'border-cockpit-accent bg-cockpit-accent/15'
          : 'border-cockpit-border bg-cockpit-bg/45 hover:border-cockpit-accent/70',
      )}
      aria-pressed={isSelected}
      onClick={() => onSelect(asset)}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-cockpit-text">
          {asset.symbol}
        </span>
        <span className="block truncate text-xs text-cockpit-text-muted">
          {asset.name}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium text-cockpit-text-muted">
        {asset.market}
      </span>
    </button>
  )
}

export function AddWatchlistAssetModal({
  isOpen,
  onClose,
}: AddWatchlistAssetModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [mode, setMode] = useState<ModalMode>('search')
  const [searchInput, setSearchInput] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<AssetDto | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateAssetBody>({
    symbol: '',
    name: '',
    market: 'NASDAQ',
    sector: '',
  })

  const debouncedSearchInput = useDebouncedValue(searchInput, searchDebounceMs)
  const assetSearchQuery = useAssetSearch(
    debouncedSearchInput,
    isOpen && mode === 'search',
  )
  const createAssetMutation = useCreateAsset()
  const addAssetMutation = useAddAssetToFirstWatchlist()

  const searchResults = assetSearchQuery.data ?? []
  const trimmedSearchInput = searchInput.trim()
  const canSearch = trimmedSearchInput.length > 0
  const canCreate = useMemo(
    () =>
      createForm.symbol.trim().length > 0 &&
      createForm.name.trim().length > 0 &&
      createForm.market.trim().length > 0,
    [createForm],
  )
  const isSubmitting =
    createAssetMutation.isPending || addAssetMutation.isPending

  useEffect(() => {
    if (!isOpen) return

    setMode('search')
    setSearchInput('')
    setSelectedAsset(null)
    setErrorMessage(null)
    setCreateForm({
      symbol: '',
      name: '',
      market: 'NASDAQ',
      sector: '',
    })
  }, [isOpen])

  if (!isOpen) return null

  const closeModal = () => {
    if (isSubmitting) return
    onClose()
  }

  const selectAsset = (asset: AssetDto) => {
    setSelectedAsset(asset)
    setErrorMessage(null)
  }

  const addSelectedAsset = async () => {
    if (!selectedAsset) return

    setErrorMessage(null)
    try {
      await addAssetMutation.mutateAsync({ asset_id: selectedAsset.id })
      onClose()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }

  const createAndAddAsset = async () => {
    if (!canCreate) return

    setErrorMessage(null)
    try {
      const asset = await createAssetMutation.mutateAsync(
        buildCreateAssetBody(createForm),
      )
      await addAssetMutation.mutateAsync({ asset_id: asset.id })
      onClose()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }

  const switchToCreate = () => {
    setMode('create')
    setSelectedAsset(null)
    setErrorMessage(null)
    setCreateForm((current) => ({
      ...current,
      symbol: trimmedSearchInput.toUpperCase(),
    }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-cockpit-border bg-cockpit-surface shadow-2xl shadow-black/45"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-start justify-between gap-3 border-b border-cockpit-border p-5">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-cockpit-text"
            >
              종목 추가
            </h2>
            <p
              id={descriptionId}
              className="mt-1 text-sm text-cockpit-text-muted"
            >
              등록된 종목을 검색해 선택하거나 새 종목을 등록합니다.
            </p>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-xl text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            aria-label="종목 추가 닫기"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-2 gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'search'}
              className={classNames(
                'rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
                mode === 'search'
                  ? 'border-cockpit-accent bg-cockpit-accent/15 text-cockpit-text'
                  : 'border-cockpit-border text-cockpit-text-muted hover:bg-cockpit-surface-muted',
              )}
              onClick={() => {
                setMode('search')
                setErrorMessage(null)
              }}
            >
              기존 종목 선택
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'create'}
              className={classNames(
                'rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
                mode === 'create'
                  ? 'border-cockpit-accent bg-cockpit-accent/15 text-cockpit-text'
                  : 'border-cockpit-border text-cockpit-text-muted hover:bg-cockpit-surface-muted',
              )}
              onClick={switchToCreate}
            >
              신규 종목 등록
            </button>
          </div>

          {errorMessage ? (
            <p
              className="mb-4 rounded-control border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {mode === 'search' ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                심볼 또는 종목명
                <Input
                  type="search"
                  value={searchInput}
                  placeholder="예: AAPL"
                  className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                  onChange={(event) => {
                    setSearchInput(event.target.value)
                    setSelectedAsset(null)
                    setErrorMessage(null)
                  }}
                />
              </label>

              <div className="flex min-h-40 flex-col gap-2" aria-live="polite">
                {!canSearch ? (
                  <p className="rounded-control border border-cockpit-border bg-cockpit-bg/35 px-3 py-4 text-sm text-cockpit-text-muted">
                    추가할 종목의 심볼을 입력하세요.
                  </p>
                ) : assetSearchQuery.isLoading ||
                  debouncedSearchInput.trim() !== trimmedSearchInput ? (
                  <Skeleton lines={3} />
                ) : assetSearchQuery.isError ? (
                  <p className="rounded-control border border-rose-500/40 bg-rose-500/10 px-3 py-4 text-sm text-rose-200">
                    종목 검색에 실패했습니다.
                  </p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((asset) => (
                    <AssetResultButton
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedAsset?.id === asset.id}
                      onSelect={selectAsset}
                    />
                  ))
                ) : (
                  <div className="rounded-control border border-cockpit-border bg-cockpit-bg/35 px-3 py-4">
                    <p className="text-sm text-cockpit-text-muted">
                      검색 결과가 없습니다.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 border-cockpit-border bg-cockpit-bg/60 text-cockpit-text"
                      onClick={switchToCreate}
                    >
                      신규 종목 등록
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                void createAndAddAsset()
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                  심볼
                  <Input
                    required
                    maxLength={20}
                    value={createForm.symbol}
                    className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        symbol: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                  시장
                  <Input
                    required
                    maxLength={20}
                    value={createForm.market}
                    className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        market: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                종목명
                <Input
                  required
                  maxLength={255}
                  value={createForm.name}
                  className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                섹터
                <Input
                  maxLength={100}
                  value={createForm.sector ?? ''}
                  className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      sector: event.target.value,
                    }))
                  }
                />
              </label>
            </form>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-cockpit-border p-5">
          <Button
            type="button"
            variant="ghost"
            className="text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            취소
          </Button>
          {mode === 'search' ? (
            <Button
              type="button"
              className="border-blue-600 bg-blue-600 text-white hover:bg-blue-500"
              disabled={!selectedAsset || isSubmitting}
              onClick={() => {
                void addSelectedAsset()
              }}
            >
              {addAssetMutation.isPending ? '추가 중' : '관심종목에 추가'}
            </Button>
          ) : (
            <Button
              type="button"
              className="border-blue-600 bg-blue-600 text-white hover:bg-blue-500"
              disabled={!canCreate || isSubmitting}
              onClick={() => {
                void createAndAddAsset()
              }}
            >
              {isSubmitting ? '등록 중' : '등록 후 추가'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
