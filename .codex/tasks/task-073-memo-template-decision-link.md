# Codex Handoff Task

## Source

이슈 #151 — 내 메모 템플릿·Decision Log 연결. 설계:
`docs/designs/151-memo-template-decision-link.md` (먼저 전체를 읽는다).

## Task Summary

BE 변경 없이 두 가지를 구현한다.

1. **메모 템플릿** — 리서치 상세 "내 메모" 카드 헤더에 "템플릿 적용"
   버튼. 메모가 비어 있을 때만 활성(내용 있으면 disabled + title
   안내), 클릭 시 설계 문서의 6개 섹션 템플릿 문자열을 draft로 설정해
   기존 자동 저장 흐름(debounce·저장 상태)을 그대로 태운다. 저장 경로
   신설 금지. placeholder 문구 갱신.
2. **Decision Log 연결** — "판단 기록" 버튼을
   `/decision-log?symbol={research.symbol}` 이동으로 변경.
   `DecisionLogPage`는 `symbol` 쿼리를 작성 폼 종목 필드의 초기값
   시드로만 사용한다 (마운트 1회, 이후 사용자 수정 자유, 기존 유효성
   규칙 재사용).

템플릿 문구·disabled 규칙·테스트 범위는 설계 문서를 그대로 따른다.

## Out of Scope

- BE 계약 변경, 메모 → reason 자동 복사, 리마인더.
- 다른 페이지·도메인 불변.

## Rules

- 현재 브랜치 `feat/151-memo-template-decision-link`에서 그대로
  작업한다. 새 브랜치를 만들지 않는다.
- 커밋은 1개로 만든다. push는 하지 않는다.
- 커밋 메시지는 한국어 `type: 본문` 형식으로 작성한다.

## Verification

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
