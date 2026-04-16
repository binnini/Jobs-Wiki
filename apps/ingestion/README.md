# Ingestion

수집 및 적재 파이프라인 계층 디렉터리입니다.

이 레이어의 책임:

- third-party API fetch
- 추후 crawling
- retry / backfill / scheduling
- source payload normalization 및 적재
- downstream canonicalization 파이프라인 트리거

이 레이어는 request/response serving 계층과 분리됩니다.
