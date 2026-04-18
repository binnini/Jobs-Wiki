---
status: draft
---

# StrataWiki Domain Bridge

## Purpose

이 문서는 `Jobs-Wiki`가 수집하거나 다루는 다양한 source-oriented 정보들을 `StrataWiki`의 domain ingestion interface와 어떻게 호환시킬지 정리합니다.

특히 아래 질문에 답하는 것이 목적입니다.

- `WorkNet`, `RSS`, `Gmail` 같은 서로 다른 source를 어떤 공통 경계로 다룰 것인가
- `StrataWiki`의 `DomainIngestionPlugin` 구조와 어떻게 맞물리게 할 것인가
- `Jobs-Wiki`가 어떤 정보를 어디까지 정규화해서 넘기는 편이 맞는가
- source 추가와 domain 추가를 어떻게 분리해서 설계할 것인가

이 문서는 `StrataWiki` 내부 구현을 이 레포로 가져오지 않습니다.
또한 이 문서는 `Jobs-Wiki`가 MCP 서버를 직접 구현한다는 뜻도 아닙니다.

## Core Observation

이 문제를 깔끔하게 풀려면 아래 세 축을 분리해서 봐야 합니다.

### 1. Connector Axis

데이터를 어디서 가져왔는가입니다.

예:

- `worknet`
- `rss`
- `gmail`
- `filesystem`

### 2. Domain Axis

그 데이터가 어떤 semantic domain으로 canonicalization 되어야 하는가입니다.

예:

- `recruiting`
- `news`
- `communications`
- `personal_knowledge`

### 3. Workspace Object Axis

최종적으로 사용자 workspace에서 어떤 object나 projection으로 보이는가입니다.

예:

- `recruitment`
- `company`
- `document`
- `activity`
- `strategy_note`

중요한 점:

- connector와 domain은 같은 것이 아닙니다.
- domain과 user-facing object family도 같은 것이 아닙니다.
- source가 하나 늘었다고 domain plugin이 늘어나는 것은 아닙니다.
- 같은 source라도 routing policy에 따라 다른 domain으로 들어갈 수 있습니다.

## Why This Matters

현재 `StrataWiki`의 ingestion 핵심 계약은 의외로 작습니다.

- common `SourceRecord`
- domain-specific `DomainIngestionPlugin`
- plugin이 `FactRecord`와 `FactRelation`을 생성

즉 `StrataWiki`는 source fetcher에 의존하지 않고, "공통 source envelope를 어떤 domain plugin이 해석하느냐"에 의존합니다.

따라서 `Jobs-Wiki`가 해야 할 일도 다음처럼 좁게 가져가는 편이 맞습니다.

- source-specific API 규칙 흡수
- source-oriented normalized payload 생성
- target domain이 해석할 수 있는 bridge envelope 생성
- 그 이후 canonical fact decomposition은 `StrataWiki` domain plugin에 맡김

## Recommended Compatibility Pipeline

권장 파이프라인:

```text
Third-party source
  -> Jobs-Wiki integration package
  -> source-oriented normalized payload
  -> Jobs-Wiki domain router / bridge adapter
  -> StrataWiki-compatible source envelope
  -> StrataWiki DomainIngestionPlugin
  -> Fact / Relation / Snapshot
```

여기서 각 단계의 책임은 아래처럼 나뉩니다.

### Integration Package

책임:

- 외부 API 인증/호출 규칙 흡수
- raw response parsing
- source-specific oddity 흡수
- source-oriented normalized payload 반환

예:

- `WorknetRecruitingSourcePayload`
- `RssFeedEntryPayload`
- `GmailMessagePayload`

### Domain Router / Bridge Adapter

책임:

- 어떤 domain으로 보낼지 결정
- payload를 `StrataWiki`가 읽을 수 있는 common source envelope로 변환
- payload version, provider, source kind 같은 bridge metadata 부착

### StrataWiki Domain Plugin

책임:

- normalized source envelope를 domain 의미로 해석
- fact entity와 relation 생성
- validation 수행
- freshness/dedupe/lifecycle 정책 적용

## Recommended Boundary in Jobs-Wiki

`Jobs-Wiki`는 `StrataWiki` Python schema를 직접 import해서 맞추는 구조보다, transport-stable JSON contract를 로컬에서 명시하는 편이 맞습니다.

이유:

- repository 분리가 유지됩니다.
- language/runtime coupling을 줄일 수 있습니다.
- `StrataWiki` 내부 파일 경로 변화에 덜 민감합니다.
- WAS와 ingestion이 같은 bridge contract를 공유할 수 있습니다.

즉 `Jobs-Wiki`가 소유해야 하는 것은 아래입니다.

- source normalized payload types
- domain routing policy
- `StrataWiki` bridge request/response contract

반면 `StrataWiki`가 소유해야 하는 것은 아래입니다.

- domain plugin semantics
- fact decomposition rules
- interpretation/personal generation semantics
- storage/snapshot ownership

## Candidate Bridge Contract

현재 `StrataWiki`의 `SourceRecord` 철학에 맞춰, `Jobs-Wiki`에서는 아래 같은 JSON-level contract를 기준으로 잡는 편이 유력합니다.

```ts
type StrataWikiSourceEnvelope = {
  sourceId: string;
  connector: string;
  domain: string;
  title: string;
  bodyMarkdown: string;
  metadata: {
    payloadVersion: string;
    provider: string;
    kind: string;
    sourceUrl?: string;
    rawIncluded?: boolean;
    [key: string]: unknown;
  };
  fetchedAt: string;
  contentHash: string;
  status: "active" | "deleted" | "archived";
};
```

현재 기준선에서 각 필드의 의미:

- `sourceId`
  - provider/source 기준 원본 식별자
- `connector`
  - 취득 메커니즘
  - 예: `worknet`, `rss`, `gmail`
- `domain`
  - `StrataWiki`에서 어떤 domain plugin이 처리할지 결정하는 semantic target
- `title`
  - generic retrieval과 readable rendering에 필요한 최소 human-readable label
- `bodyMarkdown`
  - generic fallback reading surface
- `metadata`
  - domain plugin이 상세 해석에 사용할 normalized structured payload
- `fetchedAt`
  - refresh/freshness 기준
- `contentHash`
  - dedupe/change detection 기준
- `status`
  - source lifecycle signal

## Metadata Discipline

`metadata`는 아무 데이터나 던지는 bag가 아니라, 아래처럼 versioned contract로 관리하는 편이 맞습니다.

권장 최소 공통 key:

- `payloadVersion`
- `provider`
- `kind`
- `sourceUrl`
- `mobileSourceUrl`
- `rawIncluded`

그 위에 domain-specific structured block을 둡니다.

예:

- recruiting payload
  - `posting`
  - `company`
  - `jobs`
  - `recruitmentSections`
  - `selectionSteps`
- news payload
  - `article`
  - `feed`
  - `authors`
  - `entities`
  - `publishedAt`
- email payload
  - `message`
  - `thread`
  - `participants`
  - `labels`
  - `receivedAt`

## Domain Routing Rule

가장 중요한 규칙은 "source -> domain"을 하드코딩하지 않는 것입니다.

권장 정책:

```text
connector payload
  -> route decision
  -> target domain
  -> target source kind
  -> bridge adapter
```

즉 같은 connector도 다른 domain으로 들어갈 수 있습니다.

예:

- `worknet`
  - 거의 항상 `recruiting`
- `rss`
  - `recruiting`일 수도 있음
  - `news`일 수도 있음
- `gmail`
  - `recruiting`일 수도 있음
  - `communications`일 수도 있음

## Example Routing Matrix

### WorkNet

source:

- `worknet/open_recruitment`

일반적 routing:

- target domain: `recruiting`
- target kind: `open_recruitment`

이 경우 `Jobs-Wiki/packages/integrations/worknet`가 이미 만드는 normalized recruiting payload를 bridge adapter가 `StrataWikiSourceEnvelope`로 감싸면 됩니다.

즉:

```text
WorkNet XML
  -> WorkNet integration
  -> RecruitingSourcePayload
  -> StrataWiki source envelope
  -> recruiting domain plugin
```

### RSS

source:

- `rss/feed_entry`

가능한 routing 1:

- target domain: `news`
- target kind: `article`

가능한 routing 2:

- target domain: `recruiting`
- target kind: `market_signal_article`

판단 기준:

- 단순 뉴스 보관과 탐색이 목적이면 `news`
- 채용시장 해석 evidence로 직접 쓰려면 `recruiting`

즉 RSS는 connector이지 domain이 아닙니다.

### Gmail

source:

- `gmail/message`

가능한 routing 1:

- target domain: `communications`
- target kind: `email_message`

가능한 routing 2:

- target domain: `recruiting`
- target kind: `application_email`

판단 기준:

- 일반 메일 아카이브와 thread knowledge가 목적이면 `communications`
- 지원 결과, 면접 일정, 제출 안내 같은 job-seeking lifecycle에 직접 연결되면 `recruiting`

즉 Gmail도 connector이고, 실제 semantic target은 별도 routing policy가 결정합니다.

## Important Design Choice

`Jobs-Wiki` 관점에서 news나 email을 반드시 새 domain으로 분리할 필요는 없습니다.

오히려 아래처럼 두 단계로 생각하는 편이 맞습니다.

### A. Same Domain, New Source Kind

예:

- `recruiting/open_recruitment`
- `recruiting/application_email`
- `recruiting/market_signal_article`

장점:

- recruiting interpretation이 한 domain 안에서 쌓입니다.
- Jobs-Wiki의 현재 product focus와 잘 맞습니다.
- 사용자 입장에서는 "취업 워크스페이스"라는 하나의 semantic space를 유지할 수 있습니다.

단점:

- recruiting plugin이 여러 source kind를 처리해야 합니다.
- domain plugin 복잡도가 올라갑니다.

### B. Separate Domain, Cross-Domain Read Assembly

예:

- `recruiting`
- `news`
- `communications`

장점:

- domain semantics가 더 깨끗합니다.
- 각 domain plugin이 단순해집니다.

단점:

- cross-domain retrieval/assembly가 더 중요해집니다.
- 초기 product slice에서는 과할 수 있습니다.

현재 `Jobs-Wiki`와 `StrataWiki`의 단계상, 우선은 A를 먼저 검토하는 편이 현실적입니다.

즉:

- WorkNet 공고
- 채용시장 뉴스
- 지원 관련 이메일

이 셋이 모두 "취업 워크스페이스의 근거"라면, 먼저는 `recruiting` domain의 서로 다른 `kind`로 수용하는 방향이 더 유력합니다.

## Domain Plugin Expectations

이 구조에서 `StrataWiki` domain plugin은 아래 방식으로 진화하는 편이 맞습니다.

현재:

- `plugin.accepts(source)`는 사실상 `source.domain`만 검사

권장 방향:

- `source.domain`은 plugin 선택 기준
- `metadata.kind`와 `metadata.payloadVersion`은 plugin 내부 분기 기준

예:

```text
recruiting plugin
  - kind=open_recruitment
  - kind=application_email
  - kind=market_signal_article
```

즉 domain plugin은 "하나의 source 형식"이 아니라 "하나의 domain 안의 여러 source kind"를 처리할 수 있어야 합니다.

## Mapping Rule for Jobs-Wiki Domain Models

`Jobs-Wiki`의 domain docs는 이미 source raw shape가 아니라 canonical candidate model을 정리하고 있습니다.

이 점을 bridge에 활용하는 편이 좋습니다.

권장 변환 순서:

```text
raw source
  -> integration normalized payload
  -> Jobs-Wiki canonical candidate fields
  -> StrataWiki source envelope metadata
  -> StrataWiki fact extraction
```

중요한 원칙:

- WorkNet XML을 바로 `FactRecord`로 보내지 않습니다.
- Jobs-Wiki의 `RecruitmentSummary`, `RecruitmentDetail`, `CompanyProfile` 같은 의미 있는 중간 개념을 거칩니다.
- 다만 그 중간 개념을 `StrataWiki` canonical fact와 동일하다고 가정하지는 않습니다.

즉 `Jobs-Wiki` canonical candidate model은 "product/domain language"이고, `StrataWiki` fact model은 "knowledge backend canonical language"입니다.
둘은 가깝게 맞물리되, 동일한 모델로 강제하지 않는 편이 맞습니다.

## Recommended Placement in Jobs-Wiki

현재 repo 구조 기준으로는 아래 배치가 가장 자연스럽습니다.

### `packages/integrations/*`

역할:

- source-specific normalization

예:

- `packages/integrations/worknet`
- future `packages/integrations/rss`
- future `packages/integrations/gmail`

### `apps/ingestion/`

역할:

- source fetch orchestration
- routing policy
- bridge envelope 생성
- downstream `StrataWiki` ingestion trigger

### `apps/was/`

역할:

- 일반적으로 source-to-domain bridge를 직접 수행하지 않음
- 필요한 경우 narrow admin/manual trigger만 수행

## Working Direction

현재 기준으로 가장 추천하는 방향은 아래입니다.

- `Jobs-Wiki`는 source-specific normalization까지 책임집니다.
- `Jobs-Wiki`는 `StrataWiki` fact schema를 직접 소유하지 않습니다.
- `Jobs-Wiki`는 versioned JSON bridge envelope를 소유합니다.
- `StrataWiki`는 domain plugin 안에서 `metadata.kind` 기준으로 source kind를 해석합니다.
- 새 connector 추가와 새 domain 추가를 분리해서 생각합니다.
- 초기에는 `RSS`, `Gmail`도 새 domain으로 곧바로 분리하기보다, 필요 시 `recruiting` domain 안의 새 source kind로 먼저 수용하는 편이 현실적입니다.

이 방향이면 `StrataWiki`의 domain-independent core를 유지하면서도, `Jobs-Wiki`가 필요한 source들을 점진적으로 붙일 수 있습니다.
