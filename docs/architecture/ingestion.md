# Ingestion Architecture

---
status: draft
working_notes:
  - dev-wiki/architecture/2026-04-15-ingestion-layer-placement.md
  - dev-wiki/architecture/2026-04-15-worknet-recruiting-provider.md
---

## Responsibilities

- third-party API fetch
- 추후 crawling
- scheduling / retry / backfill
- source payload normalization
- source provenance 부여
- source payload 및 downstream canonicalization 파이프라인 트리거

## Internal Layers

- source adapter execution
- crawl/fetch orchestration
- normalization layer
- persistence/queue trigger layer

## Relationship to Integrations

- ingestion은 `packages/integrations/*`를 사용합니다.
- integrations는 fetch/parse/normalize 라이브러리 역할을 합니다.
- ingestion은 orchestration 책임을 갖고, integrations는 source protocol 책임을 갖습니다.

## Relationship to WAS

- ingestion은 serving 요청 처리 책임을 갖지 않습니다.
- WAS는 ingestion 작업을 좁은 경계로 요청할 수 있습니다.
- WAS와 ingestion은 분리 배포 가능한 경계를 유지하는 것이 목표입니다.

## Future Direction

- API fetch와 crawling을 모두 ingestion에서 처리
- source payload storage 도입 가능
- canonical write pipeline 또는 downstream queue 연동 가능

## Open Questions

- source payload와 canonical payload를 모두 저장할지
- queue를 언제 도입할지
- near-real-time ingestion이 필요한지
