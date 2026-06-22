# Agent Autonomy Levels

이 문서는 AI 에이전트가 프로젝트에서 수행할 수 있는 작업 범위를 정의한다.

## Default Level

기본 자율성 레벨은 **Level 1: Local Edit**이다.

작업 문서에서 별도로 지정하지 않으면 에이전트는 Level 1 범위 안에서만 행동해야 한다.

---

## Level 0: Advisory

### Allowed

- 파일 읽기
- 코드 구조 설명
- 변경 계획 작성
- 리팩토링 제안
- 위험 요소 분석

### Not Allowed

- 파일 수정
- 명령 실행
- 커밋
- 브랜치 생성
- PR 생성

---

## Level 1: Local Edit

### Allowed

- 관련 소스 파일 수정
- 테스트 추가 또는 수정
- 문서 보완
- 로컬 lint/test/build 실행
- 실패 원인 분석 및 범위 내 수정

### Not Allowed

- 커밋
- push
- PR 생성
- 배포
- secrets 수정
- production 설정 변경
- 작업 범위 밖 파일 수정

---

## Level 2: PR Assistant

### Allowed

- 작업 브랜치 생성
- 커밋 생성
- PR 생성
- PR 설명 작성

### Not Allowed

- PR merge
- main 브랜치 직접 push
- CI 우회
- 테스트 삭제
- 배포 실행

---

## Level 3: CI Recovery

### Allowed

- CI 실패 로그 분석
- 실패 원인 최소 수정
- 기존 PR 브랜치에 수정 반영
- 테스트 재실행

### Not Allowed

- 실패와 무관한 리팩토링
- 테스트 비활성화
- 품질 게이트 우회
- 의존성 대규모 변경
- 아키텍처 변경

---

## Level 4: Autonomous Operation

현재 기본적으로 비활성화한다.

### Not Allowed by Default

- 예약 실행
- 장시간 루프
- 자동 배포
- 자동 merge
- 외부 계정 조작
- production 인프라 변경
