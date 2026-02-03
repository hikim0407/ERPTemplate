# 병렬 작업 지시문 (Parallel)

## Wave 1 (3 agents)

### Agent A — 공통코드 트리 유틸
- 범위: src/lib/code-tree-repo.ts
- 압축형: 트리/leaf/경로 생성 유틸만 구현해 API로 노출
- 목표
  - parentCode 기반 children 맵 생성
  - leaf 판별(useYn=true인 자식 없음)
  - code → 경로 문자열 생성(예: 수입 > 급여 > 월급)
- 완료 기준
  - 트리/leaf/경로 생성 함수가 분리되어 호출 가능
  - 카테고리 JSON으로 실행 가능
- 완료기준(요약): JSON 입력 → children/leaf/path 결과가 재사용 가능한 형태로 반환

### Agent B — 월별 통계 로직
- 범위: src/lib/transaction-repo.ts
- 압축형: 월 필터 + leaf 합계 + parent 롤업 합계 반환
- 목표
  - 특정 월(YYYY-MM) 필터
  - leaf 합계 계산
  - parent 롤업 합계 생성
- 완료 기준
  - 월 수입/지출 합계 및 카테고리 합계 구조 반환
  - leaf와 parent 합계 동시 제공
- 완료기준(요약): 월별 합계 + 카테고리(leaf+롤업) 합계가 함께 반환

### Agent C — 거래 입력 화면 UI
- 범위: src/app/(main)/accounting/transactions/page.tsx
- 압축형: leaf만 선택 가능한 입력 폼 + 저장 연결
- 목표
  - 카테고리 단계 선택 UI(leaf만 선택)
  - 날짜/금액/메모 입력
  - 저장 로직 연결(MVP 정책 준수)
- 완료 기준
  - 입력 필수값 검증
  - 저장 시 categoryCode는 leaf만 저장
- 완료기준(요약): 필수값 검증 통과 시 leaf 코드만 저장

## Wave 2 (2 agents)

### Agent D — 년도별 누계 로직
- 범위: src/lib/transaction-repo.ts
- 압축형: 연도 필터 + 월별 시계열 + 연간 카테고리 합계
- 목표
  - 연도 필터
  - 월별 시계열
  - 연간 카테고리 합계 Top N
- 완료 기준
  - 시계열 + 연간 합계 구조 반환
- 완료기준(요약): 연도 입력 → 시계열 + 연간 합계가 함께 반환

### Agent E — 카테고리 설정 화면
- 범위: src/app/(main)/system/main-codes/page.tsx
- 범위: src/app/(main)/system/sub-codes/page.tsx
- 압축형: 트리 조회 + useYn/sortOrder 반영(+편집 정책)
- 목표
  - 트리 조회
  - useYn/sortOrder 반영
  - JSON 편집 여부 결정(정책 반영)
- 완료 기준
  - 트리 표시 및 필터 동작 확인
- 완료기준(요약): 트리 UI에서 useYn/sortOrder 반영 확인
