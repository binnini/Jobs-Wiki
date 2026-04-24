---
status: draft
---

# LLM Requirements Baseline

## Purpose

이 문서는 Jobs-Wiki와 StrataWiki를 함께 사용하는 현재 제품에서
LLM이 어떤 역할을 맡아야 하는지 사용자-facing 기준으로 고정합니다.

핵심은 아래 세 가지입니다.

- LLM은 workspace 안의 지식을 읽고 구조화하는 계층이다
- LLM은 personal layer를 구성하는 wiki assistant다
- personal layer의 작업은 절대로 상위 layer로 전파되면 안 된다
- shared `Fact`/`Interpretation`은 personal workspace를 돕는 lightweight substrate다

## Product Position

현재 제품에서 LLM은 단순 채팅창이 아닙니다.

LLM은 아래를 담당해야 합니다.

- 사용자의 자료를 읽고 구조화한다
- shared substrate를 참고해 personal knowledge를 재구성한다
- 사용자 맥락에 맞는 answer, note, wiki document를 만든다

즉 제품 관점에서의 LLM 역할은 아래처럼 봅니다.

- `Fact`의 직접 작성자: 아님
- `Interpretation`의 주요 생성자: 맞음
- `Personal` answer와 personal wiki의 주요 작성자: 맞음

추가로, shared layer의 역할은 완결형 공용 지식 공간이라기보다
personal wiki를 grounding 하는 reusable context layer로 이해하는 것이 맞습니다.

## Layer and Directory Model

현재 workspace는 아래처럼 이해하는 것이 맞습니다.

- `shared/`
  - interpretation layer가 문서 형태로 렌더된 read-only view
  - 사용자와 LLM 모두 reference 용도로 읽을 수 있음
- `personal/raw/`
  - 사용자가 직접 만든 원문
  - markdown 초안, 업로드 PDF, 메모 등
- `personal/wiki/`
  - LLM이 raw 문서를 재가공해 만든 personal wiki 문서
  - 요약, 재작성, link/relation이 붙은 정리 문서

저장 관점의 원칙:

- `shared`의 canonical payload는 StrataWiki DB에 있음
- `shared` markdown은 rendered view임
- `personal/*`의 canonical body는 markdown 파일임
- personal DB metadata는 registry 용도에 머무름

핵심 규칙:

- 사용자는 `personal/*`에서만 생성/삭제/수정 가능
- `shared/*`는 읽기 전용
- `personal`의 어떤 작업도 `Fact`나 `Interpretation`을 직접 수정하거나 갱신해서는 안 됨

## Non-Goals

- LLM이 canonical Fact를 직접 publish하는 것
- LLM이 unrestricted DB client처럼 동작하는 것
- personal layer 작업을 interpretation 또는 fact layer로 자동 승격하는 것
- evidence 없는 free-form answer를 제품 기본값으로 두는 것
- 생성 결과를 항상 자동 저장하는 것

## Core Requirement Areas

## L1. Profile Interpretation and Extraction

LLM은 사용자의 입력과 업로드 자료를 읽고 profile snapshot 후보를 만들 수 있어야 합니다.

필수 요구사항:

- 목표 직무, 경력 수준, 학력, 선호 지역, 관심 도메인, 자유 입력을 해석할 수 있어야 합니다.
- 이력서와 포트폴리오에서 핵심 skill, strength, experience signal을 추출할 수 있어야 합니다.
- extraction 결과는 review 가능한 structured snapshot 형태로 보여야 합니다.
- extraction 결과는 canonical truth가 아니라 review 대상 제안으로 취급해야 합니다.

## L2. Workspace-Grounded Ask

Ask는 독립 채팅창이 아니라 workspace-connected analysis surface여야 합니다.

필수 요구사항:

- 질문은 현재 workspace context를 반영해야 합니다.
- 선택 공고가 있으면 그 공고 중심으로 답해야 합니다.
- 선택 문서가 있으면 그 문서 중심으로 답해야 합니다.
- 선택 컨텍스트가 없어도 전체 workspace/profile 문맥으로 답할 수 있어야 합니다.
- answer는 markdown 기반의 structured output이어야 합니다.

최소 응답 구성:

- answer
- evidence
- related opportunities
- related documents
- active context hint

## L3. Evidence and Grounding

LLM answer는 grounding 없이 노출되면 안 됩니다.

필수 요구사항:

- answer는 최소한 evidence panel과 함께 제공되어야 합니다.
- evidence는 `fact`, `interpretation`, `personal` kind를 구분할 수 있어야 합니다.
- related document나 related opportunity deep-link가 가능해야 합니다.
- answer가 어떤 snapshot과 profile version을 기반으로 했는지 설명 가능해야 합니다.

## L4. Shared Interpretation Generation

LLM은 shared layer에서 reusable interpretation을 생성할 수 있어야 합니다.

필수 요구사항:

- Fact를 근거로 trend, opportunity, risk, comparison 같은 interpretation을 제안할 수 있어야 합니다.
- interpretation은 evidence-backed, revisable, versioned state를 가져야 합니다.
- interpretation은 proposal -> validation -> publish lifecycle을 거쳐야 합니다.
- rendered shared page는 interpretation record와 분리되어야 합니다.
- interpretation은 무거운 완결형 shared brain이 아니라 reusable shared insight로 유지되는 편이 맞습니다.

현재 제품 해석:

- 사용자가 보는 `shared` 문서는 interpretation layer의 문서형 view로 이해하는 것이 맞습니다.

## L5. Personalization and User-Scoped Generation

LLM은 사용자별 profile, goal, preference를 반영한 personal answer를 생성할 수 있어야 합니다.

필수 요구사항:

- profile context를 반영해야 합니다.
- goal과 preference를 반영해야 합니다.
- 같은 질문이라도 사용자 context가 다르면 answer가 달라질 수 있어야 합니다.
- user-scoped output은 personal layer로 관리되어야 합니다.

## L6. Personal Wiki Generation

LLM은 personal/raw 문서를 personal/wiki 문서로 재구성할 수 있어야 합니다.

필수 요구사항:

- 사용자가 원할 때 raw 문서를 요약할 수 있어야 합니다.
- 사용자가 원할 때 raw 문서를 재작성할 수 있어야 합니다.
- 사용자가 원할 때 raw 문서를 구조화된 wiki note로 바꿀 수 있어야 합니다.
- 사용자가 원할 때 문서 간 relation/link를 제안하거나 부착할 수 있어야 합니다.
- shared reference를 고려해 더 풍부한 personal wiki 문서를 만들 수 있어야 합니다.

결과 규칙:

- 결과는 항상 `personal/wiki`에 저장되어야 합니다.
- 원문은 `personal/raw`에 남아야 합니다.
- 결과는 personal artifact일 뿐, shared나 interpretation layer를 직접 수정하지 않습니다.
- personal 문서의 canonical body 는 markdown 으로 유지하는 편이 맞습니다.

## L7. Retrieval Discipline

LLM은 필요한 모든 것을 자유롭게 읽는 방식이 아니라,
명시적 retrieval discipline 아래에서 동작해야 합니다.

필수 요구사항:

- 기본 retrieval mode는 curated retrieval이어야 합니다.
- 일반 질의는 `Personal -> Interpretation -> Fact` 순서로 retrieval하는 것이 기본이어야 합니다.
- exploratory retrieval은 open-ended request에서만 허용해야 합니다.
- exploratory retrieval은 read-only, scope-aware, hop-limited, result-limited여야 합니다.
- graph expansion은 support surface일 뿐, dense graph-first retrieval이 기본값이어서는 안 됩니다.

## L8. Authority Boundary

LLM은 제품의 지식 계층을 증폭하는 주체이지, canonical truth owner가 아닙니다.

필수 요구사항:

- Fact persistence, dedupe, canonical key resolution, merge, publish는 프로그램이 담당해야 합니다.
- LLM은 Fact를 직접 authoritative하게 mutate하면 안 됩니다.
- LLM output은 validation과 schema guard를 거쳐야 합니다.
- permission과 scope boundary는 프로그램이 강제해야 합니다.
- personal layer의 생성/수정/삭제는 절대로 상위 `Fact` 또는 `Interpretation` layer로 자동 전파되면 안 됩니다.
- `shared` 문서는 read-only여야 하며, LLM도 이를 직접 수정하면 안 됩니다.

## L9. Freshness, Provenance, and Explainability

LLM answer와 generated artifact는 왜 만들어졌는지 설명 가능해야 합니다.

필수 요구사항:

- answer는 fact snapshot, interpretation snapshot, profile version을 기록해야 합니다.
- prompt version과 model profile을 기록해야 합니다.
- explain_result 류의 operator path에서 추적 가능해야 합니다.
- stale/invalid 상태가 생기면 downstream personal output에 반영할 수 있어야 합니다.

## L10. Latency and Degradation

LLM path는 일반 read보다 느릴 수 있지만, 무한 대기를 허용하면 안 됩니다.

필수 요구사항:

- ask path는 bounded timeout 안에서 동작해야 합니다.
- timeout이나 temporary failure는 normalized error로 내려와야 합니다.
- fallback answer 또는 stale last-known data를 고려해야 합니다.

## UX Requirements

## UX-1 Active Context Visibility

- 사용자는 현재 Ask나 generation이 어떤 문서/공고/workspace context를 보고 있는지 알 수 있어야 합니다.

## UX-2 Layer Visibility

- 사용자는 현재 보고 있는 문서가 `shared`, `personal/raw`, `personal/wiki` 중 어디에 속하는지 알 수 있어야 합니다.

## UX-3 Grounded Presentation

- answer만 던지는 것이 아니라 근거와 연관 객체를 함께 보여줘야 합니다.

## UX-4 Honest Confidence

- 시스템이 모르는 것을 아는 것처럼 말하지 않아야 합니다.
- freshness가 불명확하면 `stale` 또는 `unknown` 계열 상태를 숨기지 않아야 합니다.

## UX-5 Save as Explicit User Action

- LLM 결과를 workspace에 남기는 행위는 기본적으로 명시적 user action이어야 합니다.

## UX-6 Read/Write Boundary

- 사용자는 `personal`에서만 create/update/delete를 수행할 수 있어야 합니다.
- 사용자는 `shared`에서는 읽기만 가능해야 합니다.
- shared 문서에서 편집 액션은 personal 쪽으로 복제/요약/재작성하는 흐름으로 연결되는 편이 맞습니다.

## MVP Baseline

현재 MVP에서 우선 구현 또는 제품 기준으로 닫아야 하는 LLM 요구사항은 아래입니다.

- extraction review용 profile interpretation
- workspace-connected Ask
- evidence panel
- related opportunity / related document 제안
- profile-aware personal query
- snapshot/provenance metadata 유지
- `personal/raw -> personal/wiki` 재가공 flow
- shared reference 기반 personal wiki 생성
- personal only write boundary

## Acceptance Questions

1. 사용자가 올린 자료를 profile snapshot 후보로 해석할 수 있는가
2. Ask가 현재 workspace context를 반영하는가
3. answer에 근거와 연관 객체가 함께 제시되는가
4. raw 문서를 wiki 문서로 재가공할 수 있는가
5. `shared`는 읽기 전용이고 `personal`만 편집 가능한가
6. personal layer 작업이 상위 layer로 전파되지 않는가
