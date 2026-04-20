# Frontend Architecture

## Status

Draft

## Responsibilities

- 사용자 입력과 화면 상태 관리
- WAS 공개 API 호출
- workspace projection을 사용자 경험에 맞게 표시
- 개인 지식 공간을 PKM형 워크스페이스로 경험하게 만드는 frontend 기반 제공

## Current MVP Baseline

현재 구현 기준선은 `workspace-first` MVP에 둡니다.

현재 우선 화면:

- `Onboarding`
- `Extraction Review`
- `Workspace Shell`
- `Document Detail`
- `Baseline Report`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

즉, `workspace`, `document`, `report`, `opportunity`, `ask`, `calendar`는
현재 첫 구현 slice의 핵심 frontend 범위로 봅니다.
다만 `graph`와 `search`는 후속 확장으로 둡니다.

## Current MVP Routes

현재 route baseline은 아래처럼 둡니다.

- `/onboarding`
- `/review`
- `/workspace`
- `/documents/:documentId`
- `/report`
- `/opportunities/:opportunityId`
- `/ask`
- `/calendar`

`Ask`는 별도 화면이지만, 선택 공고/문서 컨텍스트는 optional query로 받습니다.

- `/ask`
- `/ask?opportunityId=opp_toss_core_backend`
- `/ask?documentId=doc_strategy_note_1`

자세한 기준은 아래 문서를 따릅니다.

- `docs/architecture/frontend-routing-baseline.md`

## Workspace Views

- workspace shell
  - 현재 보고 있는 projection과 active context를 묶는 메인 shell
  - `shared`, `personal/raw`, `personal/wiki`를 명시적으로 구분해야 함
- 파일 탐색 뷰
  - `tree` 계열 navigation을 사용해 사용자 문서와 knowledge object 구조를 탐색
- 문서 뷰
  - `document` projection을 사용해 markdown 또는 구조화 콘텐츠를 읽고, Ask 진입점을 제공
- report 뷰
  - `workspace_summary` projection을 사용해 추천 공고, action queue, market brief를 제공
- opportunity 뷰
  - `opportunity` projection을 사용해 recruiting vertical detail을 제공
- 캘린더 뷰
  - `calendar` projection을 사용해 공고 마감일과 시간축 기반 action context 제공
- 그래프 뷰
  - 후속 확장 projection
- 검색/요약 뷰
  - 후속 확장 projection

## UX Direction

- frontend는 단순 검색 화면이 아니라 개인 취업 워크스페이스를 제공해야 합니다.
- workspace shell은 report 한 장이 아니라 여러 projection을 묶는 메인 UX여야 합니다.
- 사용자는 document, report, opportunity, calendar, ask 사이를 이동하며 같은 knowledge space를 다른 방식으로 탐색할 수 있어야 합니다.
- 사용자는 현재 보고 있는 문서가 `shared`, `personal/raw`, `personal/wiki` 중 어디에 속하는지 항상 이해할 수 있어야 합니다.
- `shared`는 interpretation layer의 문서형 read-only view로 보여야 합니다.
- `personal/raw`는 사용자 원문 작업 공간으로 보여야 합니다.
- `personal/wiki`는 LLM이 재가공한 personal knowledge 공간으로 보여야 합니다.
- 문서는 단순 파일이 아니라 링크, metadata, relation을 가진 knowledge object처럼 보여야 합니다.
- projection-only structure를 canonical object처럼 오해하게 만드는 UX는 피합니다.

## Data Access Rule

- frontend는 third-party API를 직접 호출하지 않습니다.
- frontend는 WAS public API만 사용합니다.
- frontend는 read authority나 MCP facade를 직접 호출하지 않습니다.

## Projection Rule

- frontend는 canonical storage shape를 직접 알 필요가 없습니다.
- frontend는 projection family를 기준으로 화면 상태를 구성합니다.
- workspace, document, opportunity, calendar, search, workspace summary는 동일한 knowledge space의 읽기 projection으로 취급합니다.
- summary card, navigation item, related object block은 projection wrapper이며 canonical object/relation ref를 가리킬 수 있습니다.

## Edit and Sync Rule

- 문서 내용의 실제 수정은 frontend가 직접 저장하지 않습니다.
- frontend는 수정 요청을 WAS로 전달하고, WAS는 이를 external MCP facade로 위임합니다.
- frontend는 command success와 read visibility를 같은 의미로 취급하지 않습니다.
- frontend는 위임 결과를 projection-local sync state와 refresh hint를 통해 다시 조회 가능한 읽기 모델에 반영받는 흐름을 전제로 합니다.
- create/update/delete는 `personal/*`에만 허용됩니다.
- `shared/*`에는 편집 액션을 제공하지 않아야 합니다.
- shared 문서에서 실행한 요약/재작성/link action의 결과는 personal layer에만 저장되어야 합니다.
- personal layer의 편집이나 LLM 재가공 결과는 상위 `Fact`나 `Interpretation` layer를 직접 수정하거나 갱신해서는 안 됩니다.

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

## Open Questions

- cache 전략
- 인증 방식
- tree/document IA를 어떻게 가볍게 시작할지
- 장기적으로 tag taxonomy UX를 별도 object family로 승격할지
- 장기적으로 user-authored schedule object가 필요한지
