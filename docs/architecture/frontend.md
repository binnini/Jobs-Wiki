# Frontend Architecture

## Status

Draft

## Responsibilities

- 사용자 입력과 화면 상태 관리
- WAS 공개 API 호출
- workspace projection을 사용자 경험에 맞게 표시
- 개인 지식 공간을 PKM형 워크스페이스로 구성

## Workspace Views

- 파일 탐색 뷰
  - `tree` projection을 사용해 사용자 문서와 navigation 구조를 탐색합니다.
- 문서 뷰
  - `document` projection을 사용해 markdown 또는 구조화 콘텐츠를 읽고, 수정/질의 요청 진입점을 제공합니다.
- 캘린더 뷰
  - `calendar` projection을 사용해 공고 마감일, 교육 일정, 사용자 준비 일정을 시간축으로 보여줍니다.
- 그래프 뷰
  - `graph` projection을 사용해 문서, 공고, 역량, 훈련 등 knowledge object 관계를 시각적으로 탐색합니다.
- 검색/요약 뷰
  - `search`, `workspace_summary` projection을 사용해 탐색과 현재 상태 요약을 제공합니다.

## UX Direction

- frontend는 단순 검색 화면이 아니라 개인 취업 워크스페이스를 제공해야 합니다.
- 사용자는 tree, document, graph, calendar, search 사이를 이동하며 같은 knowledge space를 다른 방식으로 탐색할 수 있어야 합니다.
- 문서는 단순 파일이 아니라 링크, metadata, relation을 가진 knowledge object처럼 보이도록 구성합니다.
- projection-only structure를 canonical object처럼 오해하게 만드는 UX는 피합니다.

## Data Access Rule

- frontend는 third-party API를 직접 호출하지 않습니다.
- frontend는 WAS public API만 사용합니다.
- frontend는 read authority나 MCP facade를 직접 호출하지 않습니다.

## Projection Rule

- frontend는 canonical storage shape를 직접 알 필요가 없습니다.
- frontend는 projection family를 기준으로 화면 상태를 구성합니다.
- tree, document, graph, calendar, search, workspace summary는 동일한 knowledge space의 읽기 projection으로 취급합니다.
- graph node/edge, search hit, summary card 같은 구조는 projection wrapper이며 canonical object/relation ref를 가리킬 수 있습니다.

## Edit and Sync Rule

- 문서 내용의 실제 수정은 frontend가 직접 저장하지 않습니다.
- frontend는 수정 요청을 WAS로 전달하고, WAS는 이를 external MCP facade로 위임합니다.
- frontend는 command success와 read visibility를 같은 의미로 취급하지 않습니다.
- frontend는 위임 결과를 projection-local sync state와 refresh hint를 통해 다시 조회 가능한 읽기 모델에 반영받는 흐름을 전제로 합니다.

### Default Sync Behavior

- `applied`
  - 해당 projection을 즉시 refresh합니다.
- `pending`
  - 마지막으로 확인된 데이터를 유지하고 syncing 상태를 표시합니다.
- `partial`
  - 반영 완료된 projection만 refresh하고 나머지는 stale/syncing 상태로 둡니다.
- `unknown`
  - freshness를 주장하지 않고 마지막으로 확인된 데이터를 유지합니다.
- `stale`
  - 사용 가능한 마지막 데이터를 보여주되 stale 상태를 유지합니다.

## Metadata and Relation UX Direction

- 문서 body 편집과 structured metadata 편집은 같은 UX surface에 있을 수 있지만, contract semantics는 분리될 수 있습니다.
- frontend는 relation provenance가 중요한 화면, 특히 graph/document detail에서 explicit relation과 derived relation을 구분해 보여줄 수 있어야 합니다.
- frontmatter-like field는 문서 안에 존재한다는 이유만으로 document surface로 단정하지 않습니다.

### Current Draft Direction

- `tag`는 현재 draft 방향에서 우선 metadata/filter label처럼 다룹니다.
- `calendar` 화면은 별도 calendar object 저장 모델보다 temporal projection을 우선 전제로 합니다.
- 문서 화면은 우선 `title`, `body`, selected metadata 중심으로 유지하고, document-surface presentational field는 좁게 해석합니다.

현재 frontend 기준선:

- `tag`
  - tag chip, filter, search facet, metadata decoration 중심으로 노출합니다.
  - tag detail page나 tag lifecycle UX는 현재 전제하지 않습니다.
- `calendar event`
  - calendar item은 canonical event detail보다 source object로 deep-link되는 projection item으로 설명합니다.
  - 사용자가 event 자체를 편집하는 UX보다, 관련 object 또는 metadata 수정 UX를 우선합니다.
- document-surface field
  - 문서 화면의 authored surface는 `title`, `bodyMarkdown`, 제한적 summary 중심으로 유지합니다.
  - `tags`, `status`, `dueAt`는 별도 metadata block 또는 side panel 성격으로 다루는 편이 맞습니다.

장기 확장 검토 조건:

- `tag`
  - tag별 detail 탐색, hierarchy, merge, alias 같은 taxonomy UX가 제품 핵심으로 커질 때
- `calendar event`
  - reminder, recurrence, 참석 상태, event-specific edit flow가 필요해질 때
- document-surface field
  - subtitle, cover, icon 같은 presentational field가 여러 화면에서 반복적으로 요구될 때

## Open Questions

- 라우팅 구조
- 캐시 전략
- 인증 방식
- 그래프 렌더링과 대규모 노드 탐색의 성능 한계
- 장기적으로 `tag` taxonomy UX를 별도 object family로 승격할 필요가 생기는지
- 장기적으로 user-authored schedule object가 필요한지
- 제한적 summary 외 document-surface field 확장이 실제로 반복 요구되는지
