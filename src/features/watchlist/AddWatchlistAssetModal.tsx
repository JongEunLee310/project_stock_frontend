import type { KeyboardEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import { Badge, Button, Input, Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

import type { AssetLookupItemDto } from './dto'
import {
  fetchAssetsBySymbol,
  useAddAssetToFirstWatchlist,
  useAssetLookup,
  useCreateAsset,
} from './queries'

interface AddWatchlistAssetModalProps {
  isOpen: boolean
  onClose: () => void
}

type LookupInput = 'symbol' | 'name'

const searchDebounceMs = 350
const markets = [
  { label: '전체', value: '' },
  { label: 'NASDAQ', value: 'NASDAQ' },
  { label: 'NYSE', value: 'NYSE' },
  { label: 'KOSPI', value: 'KOSPI' },
  { label: 'KOSDAQ', value: 'KOSDAQ' },
] as const
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

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

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => element.getAttribute('aria-hidden') !== 'true')
}

function lookupKey(asset: AssetLookupItemDto) {
  return `${asset.market}:${asset.symbol}`
}

function AssetLookupOption({
  asset,
  isSelected,
  onSelect,
}: {
  asset: AssetLookupItemDto
  isSelected: boolean
  onSelect: (asset: AssetLookupItemDto) => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      className={classNames(
        'flex w-full items-start justify-between gap-3 rounded-control border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
        isSelected
          ? 'border-cockpit-accent bg-cockpit-accent/15'
          : 'border-cockpit-border bg-cockpit-bg/45 hover:border-cockpit-accent/70',
      )}
      onClick={() => onSelect(asset)}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-cockpit-text">
            {asset.symbol}
          </span>
          <Badge tone={asset.registered ? 'info' : 'neutral'}>
            {asset.registered ? '등록됨' : '시장 확인'}
          </Badge>
        </span>
        <span className="mt-1 block truncate text-xs text-cockpit-text-muted">
          {asset.name}
        </span>
        {asset.sector ? (
          <span className="mt-1 block text-xs text-cockpit-text-muted">
            {asset.sector}
          </span>
        ) : null}
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
  const listboxId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [market, setMarket] = useState('')
  const [symbolInput, setSymbolInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [activeLookupInput, setActiveLookupInput] =
    useState<LookupInput>('symbol')
  const [selectedAsset, setSelectedAsset] = useState<AssetLookupItemDto | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeLookupValue =
    activeLookupInput === 'symbol' ? symbolInput : nameInput
  const debouncedLookupValue = useDebouncedValue(
    activeLookupValue,
    searchDebounceMs,
  )
  const assetLookupQuery = useAssetLookup(
    debouncedLookupValue,
    market.length > 0 ? market : null,
    isOpen,
  )
  const createAssetMutation = useCreateAsset()
  const addAssetMutation = useAddAssetToFirstWatchlist()

  const lookupItems = assetLookupQuery.data?.items ?? []
  const trimmedLookupValue = activeLookupValue.trim()
  const canLookup = trimmedLookupValue.length > 0
  const isLookupSettling = debouncedLookupValue.trim() !== trimmedLookupValue
  const isSubmitting =
    createAssetMutation.isPending || addAssetMutation.isPending

  useEffect(() => {
    if (!isOpen) return

    setMarket('')
    setSymbolInput('')
    setNameInput('')
    setActiveLookupInput('symbol')
    setSelectedAsset(null)
    setErrorMessage(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    dialogRef.current?.focus()
  }, [isOpen])

  const closeModal = () => {
    if (isSubmitting) return
    onClose()
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      closeModal()
      return
    }

    if (event.key !== 'Tab') return

    const dialogElement = dialogRef.current
    if (!dialogElement) return

    const focusableElements = getFocusableElements(dialogElement)
    if (focusableElements.length === 0) {
      event.preventDefault()
      dialogElement.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  if (!isOpen) return null

  const clearSelection = () => {
    setSelectedAsset(null)
    setErrorMessage(null)
  }

  const selectAsset = (asset: AssetLookupItemDto) => {
    setSelectedAsset(asset)
    setSymbolInput(asset.symbol)
    setNameInput(asset.name)
    setErrorMessage(null)
  }

  const addSelectedAsset = async () => {
    if (!selectedAsset) return

    setErrorMessage(null)
    try {
      const assetId = selectedAsset.registered
        ? await resolveRegisteredAssetId(selectedAsset)
        : (
            await createAssetMutation.mutateAsync({
              symbol: selectedAsset.symbol,
              market: selectedAsset.market,
            })
          ).id

      await addAssetMutation.mutateAsync({ asset_id: assetId })
      onClose()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }

  const selectedLookupKey = selectedAsset ? lookupKey(selectedAsset) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-cockpit-border bg-cockpit-surface shadow-2xl shadow-black/45"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
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
              시장 데이터에서 종목을 검색하고 결과를 선택합니다.
            </p>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-xl text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            aria-label="종목 추가 닫기"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {errorMessage ? (
            <p
              className="mb-4 rounded-control border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
              시장
              <select
                value={market}
                className="min-h-10 rounded-control border border-cockpit-border bg-cockpit-bg/70 px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
                onChange={(event) => {
                  setMarket(event.target.value)
                  clearSelection()
                }}
              >
                {markets.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                심볼
                <Input
                  type="search"
                  value={symbolInput}
                  placeholder="예: AAPL"
                  aria-controls={listboxId}
                  aria-expanded={canLookup}
                  className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                  onChange={(event) => {
                    setActiveLookupInput('symbol')
                    setSymbolInput(event.target.value)
                    clearSelection()
                  }}
                  onFocus={() => setActiveLookupInput('symbol')}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-cockpit-text">
                종목명
                <Input
                  type="search"
                  value={nameInput}
                  placeholder="예: Apple"
                  aria-controls={listboxId}
                  aria-expanded={canLookup}
                  className="border-cockpit-border bg-cockpit-bg/70 text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                  onChange={(event) => {
                    setActiveLookupInput('name')
                    setNameInput(event.target.value)
                    clearSelection()
                  }}
                  onFocus={() => setActiveLookupInput('name')}
                />
              </label>
            </div>

            <div
              id={listboxId}
              className="flex min-h-40 flex-col gap-2"
              role={lookupItems.length > 0 ? 'listbox' : undefined}
              aria-live="polite"
            >
              {!canLookup ? (
                <p className="rounded-control border border-cockpit-border bg-cockpit-bg/35 px-3 py-4 text-sm text-cockpit-text-muted">
                  심볼이나 종목명을 입력하세요.
                </p>
              ) : assetLookupQuery.isLoading || isLookupSettling ? (
                <Skeleton lines={3} />
              ) : assetLookupQuery.isError ? (
                <p className="rounded-control border border-rose-500/40 bg-rose-500/10 px-3 py-4 text-sm text-rose-200">
                  종목 조회에 실패했습니다.
                </p>
              ) : lookupItems.length > 0 ? (
                lookupItems.map((asset) => (
                  <AssetLookupOption
                    key={lookupKey(asset)}
                    asset={asset}
                    isSelected={selectedLookupKey === lookupKey(asset)}
                    onSelect={selectAsset}
                  />
                ))
              ) : (
                <p className="rounded-control border border-cockpit-border bg-cockpit-bg/35 px-3 py-4 text-sm text-cockpit-text-muted">
                  해당 시장에서 종목을 찾지 못했습니다.
                </p>
              )}
            </div>
          </div>
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
          <Button
            type="button"
            className="border-blue-600 bg-blue-600 text-white hover:bg-blue-500"
            disabled={!selectedAsset || isSubmitting}
            onClick={() => {
              void addSelectedAsset()
            }}
          >
            {isSubmitting ? '추가 중' : '관심종목에 추가'}
          </Button>
        </div>
      </div>
    </div>
  )
}

async function resolveRegisteredAssetId(asset: AssetLookupItemDto) {
  const registeredAssets = await fetchAssetsBySymbol(asset.symbol)
  const registeredAsset = registeredAssets.find(
    (candidate) =>
      candidate.symbol === asset.symbol && candidate.market === asset.market,
  )

  if (!registeredAsset) {
    throw new Error('등록된 종목 ID를 확인하지 못했습니다.')
  }

  return registeredAsset.id
}
