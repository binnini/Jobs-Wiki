# Docs

이 디렉터리는 Jobs-Wiki 웹 서비스 레포의 문서를 관리합니다.

## Principles

- 이 레포는 웹 서비스 중심 레포입니다.
- MCP 서버 구현은 이 레포에 포함하지 않습니다.
- MCP 기반 클라이언트는 WAS 공개 계약을 소비하는 외부 소비자로 취급합니다.
- Ingestion은 WAS와 분리된 별도 계층으로 다룹니다.
- WAS는 ingestion을 직접 수행하지 않습니다.
- third-party 문서, 내부 도메인 모델, 공개 API 계약을 분리해 관리합니다.
- 개발 중 생성되는 임시 노트, 비교안, 실험 기록은 `dev-wiki/`에 둡니다.

## Sections

- `product/`: 제품 목표와 범위
- `architecture/`: 시스템 구조와 경계
- `api/`: 공개 API 및 외부 연동 계약
- `domain/`: 내부 표준 모델과 도메인 개념
- `operations/`: 환경, 설정, 보안, 관측성
- `third-party/`: 외부 서비스 원문과 정리본

## Current MVP Start Here

현재 기준선은 `PKM workspace-first MVP` 입니다. 아래 문서들을 먼저 보고, 오래된 report-first 또는 generic PKM 방향 문서와 충돌하면 이 기준선을 우선합니다.

현재 레이어/디렉터리 해석:

- `shared/`
  - interpretation layer가 문서 형태로 렌더된 read-only view
- `personal/raw/`
  - 사용자가 직접 작성하거나 업로드한 원문
- `personal/wiki/`
  - LLM이 raw 문서를 재가공한 personal artifact

핵심 경계:

- 사용자는 `personal/*`에서만 create/update/delete를 수행합니다.
- `shared/*`는 읽기 전용입니다.
- personal layer의 작업은 `Fact`, `Interpretation`, `shared`로 자동 전파되지 않습니다.

- `product/llm-requirements-baseline.md`
  - 사용자-facing LLM 역할, grounding, personalization, authority boundary를 고정하는 기준선 문서
- `product/mvp-requirements-baseline.md`
  - 현재 MVP 범위, workspace-first route baseline, must/should/won't를 고정하는 기준선 문서
- `api/mvp-api-baseline.md`
  - 현재 구현된 MVP endpoint set과 response shape를 고정하는 구현 기준 문서
- `operations/non-functional-requirements.md`
  - 현재 MVP의 timeout, degradation, error normalization, cache 기준선 문서

주의:

- `product/llm-requirements-baseline.md`와 `product/mvp-requirements-baseline.md`는 현재 제품 목표 기준선입니다.
- `api/mvp-api-baseline.md`는 target MVP contract와 현재 구현된 endpoint slice를 함께 설명하는 문서입니다.

현재 slice에서 secondary/background 로 취급할 문서 예시:

- `api/workspace-mvp-read-contract.md`
- `architecture/stratawiki-web-integration.md`
- `architecture/web-service-requirements-analysis.md`

## Current MVP Run And Verify

저장소 루트 기준:

```bash
npm run start:was
npm run dev:frontend
```

기본 로컬 주소:

- WAS: `http://127.0.0.1:4310`
- frontend dev: `http://127.0.0.1:5173`

기본 dev proxy:

- frontend의 `/api`, `/health` 는 `http://127.0.0.1:4310` 으로 프록시됩니다.
- 다른 WAS 주소를 쓰려면 `WAS_PROXY_TARGET=http://host:port npm run dev:frontend` 를 사용합니다.

최소 smoke verification:

```bash
npm run verify:mvp
curl http://127.0.0.1:4310/health
curl http://127.0.0.1:4310/api/workspace/summary
```

live integration smoke:

```bash
npm run smoke:live
```

## Supporting MVP Docs

현재 웹 서비스 구현 논의를 이어갈 때 참고할 문서:

- `api/mvp-api-examples.md`
  - MVP endpoint별 request, success, empty, error example payload를 정리한 문서
- `product/ui-screen-spec.md`
  - wireframe 다음 단계에서 화면별 역할, 필요한 데이터, CTA, 이동 흐름을 정리한 UI 명세 문서
- `product/ui-state-spec.md`
  - 화면별 loading, empty, error, stale, no-selection 상태를 정리한 UI 상태 명세 문서
- `product/mvp-requirements-baseline.md`
  - 현재 MVP에서 반드시 구현할 것과 이번 slice에서 미룰 것을 한 장으로 고정한 요구사항 기준선 문서
- `product/llm-requirements-baseline.md`
  - extraction, Ask, interpretation, personal artifact 방향을 묶은 LLM 요구사항 기준선 문서
- `product/requirements-realignment-matrix.md`
  - LLM 요구사항과 workspace-first MVP 기준으로 기존 요구사항을 재배치한 표 문서
- `architecture/frontend-view-model.md`
  - API response field가 실제 UI block에 어떻게 매핑되는지 정리한 frontend 구현 기준 문서
- `architecture/frontend-routing-baseline.md`
  - workspace-first MVP 기준의 현재 frontend route set과 Ask query context 규칙을 정리한 문서
- `architecture/was-runtime-layout.md`
  - apps/was의 route, service, mapper, adapter, fixture 구조를 구현 직전 수준으로 정리한 문서
- `architecture/was-adapter-contract.md`
  - WAS 내부 adapter interface와 normalized record shape를 정리한 문서
- `api/was-mvp-contract.md`
  - 첫 구현에 사용할 WAS endpoint 범위와 shared vocabulary를 좁게 고정한 문서
- `api/opportunity-projection.md`
  - opportunity list/detail, evidence, company/role block을 정의한 사용자-facing projection 문서
- `product/baseline-report-wireframe.md`
  - onboarding 직후 보여줄 기본 리포트 화면의 desktop/mobile 저해상도 wireframe
- `architecture/was.md`
  - WAS 책임과 경계

## Official vs Working Docs

- `docs/`: 공식 프로젝트 문서
- `dev-wiki/`: 개발 중 작업 메모와 실험 기록

## Metadata Rule

공식 문서는 필요할 경우 아래와 같은 최소 메타데이터를 가질 수 있습니다.

```md
---
status: draft
working_notes:
  - dev-wiki/architecture/2026-04-15-doc-boundary.md
---
```

규칙:

- `docs/`에서는 `working_notes`만 허용합니다.
- `depends_on` 같은 강한 표현은 사용하지 않습니다.
- `dev-wiki` 문서끼리 연결하는 `related_notes`는 사용하지 않습니다.
