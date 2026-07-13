# Design Record Policy

## Purpose

Defines when a design record must be written before a Codex handoff, and what it must contain. A design record captures the shape of a change — data model, API surface, and component responsibilities — so implementation does not silently invent an architecture.

## When a Design Record Is Required

Write a design record before handoff when the change introduces any of:

- A new domain or bounded context.
- A new table or persisted model.
- A new external dependency (third-party API, queue, storage, service).
- An architectural decision that affects how later work is structured.

## When It Can Be Skipped

Skip the design record for pure test changes, documentation-only changes, and contained bug fixes that do not alter the data model, API surface, or dependencies.

## Location and Naming

`docs/designs/<issue>-<slug>.md`

One file per issue. `<slug>` is a short kebab-case summary of the change.

## Content Rules

Keep the record at skeleton level. Describe structure, not implementation.

- **Models** — fields with type and constraints only.
- **APIs** — method, path, and request/response schema name only.
- **Services / repositories** — signature plus a one-line responsibility each.

Do not include SQL, query bodies, migrations, or business-logic code. If a detail belongs in implementation, it does not belong in the design record.

## Timing

The design record is written before the Codex handoff and referenced from the handoff task, so Codex implements against an agreed shape.

## Document Language

설계 문서(`docs/designs/`)·ADR(`docs/decisions/`)·리뷰 기록 등 한국어 산문을 쓰는 문서의
본문은 한국어로 작성한다. 섹션 헤더와 Status 등 고정 라벨, 그리고 코드 기호(클래스·함수·
enum 값·파일 경로·설정 키·식별자)는 영어로 유지한다 — 산문만 한국어로 쓰고 정보 밀도는
보존한다.

한국어로 자연스럽게 읽히는 문장 구조를 쓴다. 영어 직역체, 동사를 명사형으로 끝맺는
과도한 압축(예: "~ 정리.", "~ 일관."), 절을 화살표(`→`)로 잇는 표기, 여러 수식을 한
명사에 욱여넣어 한 번에 읽기 어려운 구조를 피한다. 주어와 서술어가 분명한 문장으로
풀어 쓰되, 기술 식별자와 정보 밀도는 그대로 둔다 — 구조만 자연스럽게 한다. 이 원칙은
설계·ADR·리뷰·PR·핸드오프 등 한국어 산문을 쓰는 모든 문서에 적용한다.

설계 문서의 데이터 계약 리터럴(enum 값·필드 형식·경계값·키 스킴)에는 출처를 명시하고,
출처를 댈 수 없는 값은 "가정"으로 표기한다. 상세는 `quality-process-policy.md`의 Design
Fact Grounding을 따른다.

## Related

- `handoff-policy.md` — design records are an input to the handoff.
- `quality-process-policy.md` — 리터럴 계약의 출처 명시와 셀프 검토 체크포인트.
- `docs/decisions/` — ADRs capture _why_ a durable decision was made; design records capture _what shape_ a specific change takes.
- `docs/designs/README.md` — directory conventions and skeleton template.
