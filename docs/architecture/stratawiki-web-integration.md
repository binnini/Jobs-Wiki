---
status: draft
---

# StrataWiki Web Integration

## Purpose

이 문서는 `StrataWiki` MCP 서버 MVP를 기준으로, `Jobs-Wiki` 웹 시스템이 어떤 방식으로 그 위에 올라갈 수 있는지 설명합니다.

이 문서는 아래를 정리합니다.

- `StrataWiki`를 Jobs-Wiki 관점에서 어떻게 해석할지
- WAS가 `StrataWiki`와 어떤 read/command 경계를 가져야 하는지
- frontend가 어떤 사용자 경험 단위로 knowledge space를 보여주는 편이 맞는지
- MVP에서 무엇을 먼저 연결하고, 무엇을 나중으로 미루는 편이 맞는지

이 문서는 final deployment contract를 고정하지 않습니다.
현재 구현과 문서 기준으로 가장 자연스러운 web integration draft를 정리하는 것이 목적입니다.

## Current Reading of StrataWiki

현재 `StrataWiki`는 일반적인 markdown wiki backend라기보다, 아래 성격이 더 강합니다.

- canonical `Fact` write authority
- shared `Interpretation` generation and publication engine
- user-scoped `Personal` answer generation and persistence engine
- snapshot-aware retrieval and provenance engine

현재 MVP에서 실제로 강한 부분:

- recruiting source를 canonical fact로 ingest
- one-family interpretation snapshot build and publish
- `Personal -> Interpretation -> Fact` curated retrieval
- snapshot/profile-bound personal answer generation
- saved personal answer markdown persistence

현재 MVP에서 아직 약한 부분:

- rendered page read surface
- tree/document/calendar/graph/search projection read API
- broad command family
- worker/scheduler가 전제된 장기 regeneration path

즉 현재 단계의 `StrataWiki`는 "완성형 workspace backend"보다 "지식 엔진 + personalized answer engine"으로 보는 편이 맞습니다.

## Integration Position

`Jobs-Wiki`는 계속 web-service-centered repository로 남고, `StrataWiki`는 external knowledge backend로 취급하는 편이 맞습니다.

권장 해석:

- `Jobs-Wiki frontend`
  - user-facing workspace projection과 interaction을 담당
- `Jobs-Wiki WAS`
  - frontend-facing HTTP contract, auth, error normalization, projection assembly를 담당
- `StrataWiki`
  - canonical knowledge backend와 MCP runtime을 담당

핵심 원칙:

- frontend는 `StrataWiki`를 직접 호출하지 않습니다.
- frontend는 WAS만 호출합니다.
- WAS는 `StrataWiki`의 raw storage shape를 그대로 노출하지 않습니다.
- WAS는 read path와 command path를 분리합니다.

## Recommended Logical Split

물리적으로 `StrataWiki`가 하나의 service여도, `Jobs-Wiki WAS` 입장에서는 아래 두 dependency로 논리 분리하는 편이 맞습니다.

### 1. StrataWiki Read Authority

역할:

- user-visible knowledge state read
- personal query read orchestration
- interpretation/fact/personal detail read
- projection materialization에 필요한 object/relation/snapshot read

이 dependency는 normal read path를 담당합니다.

### 2. StrataWiki Command Facade

역할:

- user intent command submission
- command status 조회
- affected object/refreshed projection hint 반환
- authoritative한 경우에만 visibility state 보고

이 dependency는 mutation-oriented path를 담당합니다.

### Why This Split

- `StrataWiki`의 `query_personal_knowledge`는 현재 구현상 command가 아니라 read-side orchestration에 가깝습니다.
- 반대로 문서 수정, metadata patch, relation upsert 같은 작업은 장기적으로 command boundary가 별도로 필요합니다.
- 이 둘을 하나의 "MCP backend"로만 부르면, web 설계에서 read path와 command path가 쉽게 섞입니다.

## Runtime Topology

권장 topology:

```text
User
  -> Frontend
  -> Jobs-Wiki WAS
       -> StrataWiki Read Authority
       -> StrataWiki Command Facade

Third-party APIs
  -> Jobs-Wiki Ingestion
  -> StrataWiki canonical write path
```

현재 MVP에서 더 구체적으로 보면:

```text
WorkNet source
  -> normalization / ingestion
  -> StrataWiki Fact
  -> StrataWiki Interpretation publish
  -> StrataWiki Personal query/save

User question
  -> Frontend Ask Workspace
  -> Jobs-Wiki WAS
  -> StrataWiki query_personal_knowledge
  -> WAS envelope adaptation
  -> Frontend answer/evidence/document surfaces
```

## Read Path Design

초기 web MVP에서 가장 중요한 read path는 아래입니다.

```text
frontend
  -> GET /workspace/personal-knowledge/query
  -> Jobs-Wiki WAS
  -> StrataWiki Read Authority
  -> answer + provenance + evidence refs
  -> WAS projection envelope
  -> frontend panels
```

이 단계에서 `query_personal_knowledge`는 search endpoint가 아니라, "질문에 대한 workspace read assembly"로 설명하는 편이 맞습니다.

현재 추천 read decomposition:

- personal query read
- document detail read
- workspace summary read
- calendar read
- graph neighborhood read

이 중 첫 연결 우선순위는 personal query read입니다.

## Command Path Design

문서 편집이나 metadata 변경 같은 user action은 아래처럼 두는 편이 맞습니다.

```text
frontend edit action
  -> POST /workspace/commands
  -> Jobs-Wiki WAS
  -> StrataWiki Command Facade
  -> accepted / conflict / failed
  -> GET /workspace/commands/{id}
  -> projection visibility refresh
```

중요한 원칙:

- command acceptance와 read visibility는 다릅니다.
- `StrataWiki`가 projection visibility를 authoritative하게 말할 수 없는 경우, WAS도 `applied`를 추론하지 않습니다.
- frontend는 `pending`, `partial`, `unknown`, `stale`를 정직하게 보여줄 수 있어야 합니다.

## Candidate WAS Adapters

현재 단계에서 `Jobs-Wiki WAS` 안에 아래 adapter interface를 두는 방향이 유력합니다.

```ts
type StrataWikiReadAuthority = {
  queryPersonalKnowledge(input: {
    userId: string;
    tenantId: string;
    domain: string;
    question: string;
    profileVersion: string;
    modelProfile: string;
    save?: boolean;
  }): Promise<{
    answerMarkdown: string;
    personalRecordIds: string[];
    interpretationRecordIds: string[];
    factRecordIds: string[];
    provenance: {
      factSnapshot: string;
      interpretationSnapshot?: string;
      profileVersion: string;
      modelProfile: string;
      provider: string;
      model: string;
    };
  }>;
  getPersonalRecord(recordId: string): Promise<unknown | null>;
  getInterpretationRecord(recordId: string): Promise<unknown | null>;
  getFactRecord(recordId: string): Promise<unknown | null>;
  getSnapshotStatus(input: {
    domain: string;
    family?: string;
  }): Promise<{
    factSnapshot: string;
    interpretationSnapshot?: string;
    publishedAt?: string;
  }>;
};

type StrataWikiCommandFacade = {
  submitCommand(input: WorkspaceCommandRequest): Promise<WorkspaceCommandReceipt>;
  getCommand(commandId: string): Promise<WorkspaceCommandStatus>;
};
```

여기서 핵심은 WAS가 `StrataWiki`의 internal schema를 그대로 퍼뜨리지 않고, frontend에 필요한 candidate contract로 한 번 더 절단한다는 점입니다.

## Frontend Information Architecture

초기 web MVP는 "모든 projection을 다 구현한 PKM"보다, `StrataWiki`의 현재 강점을 가장 잘 드러내는 화면부터 시작하는 편이 맞습니다.

권장 IA:

- Workspace Home
- Ask Workspace
- Document Detail
- Opportunity Calendar

### Workspace Home

역할:

- 최근 personalized outputs 진입점
- 현재 interpretation highlights
- 마감 임박 opportunity
- sync/status summary

핵심 블록:

- latest personal briefings
- recent interpretation cards
- closing soon calendar strip
- workspace summary/status

### Ask Workspace

역할:

- 현재 `StrataWiki` MVP를 가장 직접적으로 보여주는 메인 화면
- user question -> personalized answer -> evidence navigation

권장 패널:

- question composer
- answer panel
- evidence panel
- related document panel
- save/regenerate controls

표시 원칙:

- answer를 맨 위에 둡니다.
- 그 아래에 evidence refs와 provenance를 둡니다.
- `Fact / Interpretation / Personal`는 내부 모델이므로 탭 이름으로 전면 노출하지 않고, "근거", "공유 인사이트", "내 문맥"처럼 번역하는 편이 맞습니다.

### Document Detail

역할:

- one record-centered reading surface
- personal answer, interpretation, fact를 같은 shell에서 읽게 함

권장 layout:

- center: title, summary, body
- right rail: provenance, snapshot, related refs, sync state
- bottom or side tabs: linked items and evidence

Document Detail은 지금 단계에서 tree explorer보다 먼저 있어야 합니다.
이유는 `StrataWiki`가 이미 record/provenance 중심 구조를 갖고 있기 때문입니다.

### Opportunity Calendar

역할:

- recruiting domain의 temporal surface
- `closes_at`, `starts_at` 같은 field를 user-visible time view로 변환

현재는 projection-only temporal item으로 시작하는 편이 맞습니다.
별도 canonical calendar object를 전제하지 않습니다.

## UX Translation Rule

`StrataWiki` 내부 layer를 UI vocabulary로 그대로 노출하지 않는 편이 맞습니다.

권장 번역:

- `Fact`
  - 원문 근거
  - 공고/회사/역량 정보
- `Interpretation`
  - 공유 인사이트
  - 시장 해석
  - 공통 패턴
- `Personal`
  - 내 브리핑
  - 다음 액션
  - 내 질문 결과

이 원칙은 user가 system implementation을 배우지 않아도 workspace를 이해하게 만들기 위해 필요합니다.

## MVP Screen Flow

현재 가장 현실적인 MVP flow는 아래입니다.

```text
1. User opens Workspace Home
2. User enters a question in Ask Workspace
3. Frontend calls WAS personal knowledge query
4. WAS calls StrataWiki read authority
5. Frontend renders:
   - short personalized answer
   - evidence anchors
   - related shared insight cards
   - next documents to open
6. User opens one linked record in Document Detail
7. User optionally saves or regenerates personal output
```

이 흐름은 `StrataWiki`의 현재 MVP와 가장 잘 맞고, `Jobs-Wiki`의 workspace product shape도 훼손하지 않습니다.

## What To Delay

초기 MVP에서 뒤로 미루는 편이 좋은 것:

- full tree/file explorer를 primary surface로 두는 것
- graph explorer를 first-class main navigation으로 두는 것
- skill taxonomy를 너무 강한 canonical UX로 노출하는 것
- full command system을 personal query보다 먼저 여는 것
- broad public resource API를 workspace UX보다 먼저 안정화하는 것

이유:

- `StrataWiki`의 현재 강점은 "질문 기반 personalized workspace answer"입니다.
- 반면 rendered page read, graph materialization, broad command surface는 아직 얇거나 미완입니다.
- 따라서 웹도 강한 부분부터 제품화하는 편이 맞습니다.

## Recommended Phasing

### Phase 1. Ask Workspace First

목표:

- `StrataWiki`의 현재 MVP를 web value로 직접 연결

범위:

- `GET /workspace/personal-knowledge/query`
- answer view
- evidence list
- linked document open

### Phase 2. Record-Centered Workspace

목표:

- answer 결과에서 record exploration으로 자연스럽게 이동

범위:

- document detail shell
- interpretation detail
- fact detail
- snapshot/provenance rail

### Phase 3. Temporal and Summary Projections

목표:

- workspace를 질문 응답 화면에서 "지속적으로 보는 공간"으로 확장

범위:

- workspace home
- opportunity calendar
- workspace summary

### Phase 4. Command and Refresh Loop

목표:

- user edit action과 read visibility refresh를 연결

범위:

- command submission/status
- sync state UX
- targeted refresh hints

### Phase 5. Richer Exploration

목표:

- graph/tree/search를 점진적으로 확장

범위:

- graph neighborhood read
- tree/navigation projection
- richer search

## Working Direction

현재 기준으로 가장 추천하는 방향은 아래입니다.

- `StrataWiki`는 external knowledge backend로 둡니다.
- `Jobs-Wiki WAS`는 `StrataWiki Read Authority`와 `StrataWiki Command Facade`를 논리 분리합니다.
- web MVP의 중심 화면은 `Ask Workspace`로 둡니다.
- tree/graph보다 answer/evidence/document flow를 먼저 완성합니다.
- layer vocabulary는 내부 구조로 사용하고, user-facing UX는 workspace vocabulary로 번역합니다.

이 방향은 현재 두 repository의 문서 원칙과 실제 구현 상태를 모두 가장 덜 무리하게 연결하는 선택입니다.
