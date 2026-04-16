# Product Scope

## In Scope

- 사용자별 지식 공간 조회
- PKM형 파일 탐색 UI
- markdown 또는 구조화 문서 상세 조회
- 같은 knowledge space를 여러 projection으로 제공하는 read model 설계
- 채용 공고, 직무, 기업, 훈련 정보의 탐색과 연결
- 캘린더 기반 일정 조회
- 그래프 기반 문서/엔티티 관계 탐색
- frontend와 WAS 사이의 사용자-facing 계약 설계
- WAS와 external read authority 사이의 조회 경계 설계
- WAS와 external MCP facade 사이의 command 경계 설계
- command status와 read visibility를 분리한 sync 모델 설계
- 별도 ingestion 계층 설계

## Out of Scope

- MCP 서버 구현
- external knowledge backend와 DB schema ownership
- 별도 운영 자동화 클라이언트 구현
- WAS 내부에서 ingestion fetch/retry/backfill orchestration 수행
- 초기에 추천, 알림, 협업, 고급 자동화까지 모두 고정 구현하는 것

## Delivery Phasing

### MVP

- 사용자별 문서/폴더 조회
- 문서 상세 조회
- PKM형 파일 탐색 화면
- 캘린더 뷰
- 기본 그래프 뷰
- MCP 위임 요청 경계

### v1

- 백링크와 연관 문서 탐색
- 통합 검색
- 개인화 대시보드
- 동기화 상태 표시
- 그래프 필터링

### Extended

- 의미 기반 검색
- 추천 공고/교육/액션
- 문서 버전 이력
- 활동 타임라인
- 알림
- 공유/협업

## Open Questions

현재 draft direction:

- `tag`는 우선 metadata/filter/search label로 둡니다.
- `calendar event`는 우선 projection-only temporal item으로 둡니다.
- document-surface field는 우선 `title`, `bodyMarkdown`, 제한적 summary로 좁게 둡니다.

장기 open questions:

- curated taxonomy가 필요해져 `tag`에 stable identity와 lifecycle이 실제로 필요해지는지
- user-authored planning 요구가 커져 `calendar event` 또는 schedule object를 canonical object로 도입해야 하는지
- 제한적 summary 외 subtitle, cover, icon 같은 presentational field가 반복적으로 필요해지는지
