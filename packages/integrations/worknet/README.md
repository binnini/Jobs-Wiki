# WorkNet Integration

고용24 WorkNet OPEN-API 연동 전용 패키지입니다.

이 패키지는 두 개의 레이어를 제공합니다.

- low-level WorkNet API layer
- domain-facing normalized recruiting layer

- [src/types.ts](./src/types.ts): 외부 응답 중심 타입 정의
- [src/adapter.ts](./src/adapter.ts): 외부 연동 어댑터 인터페이스
- [src/client.ts](./src/client.ts): 실제 WorkNet 클라이언트
- [src/mappers.ts](./src/mappers.ts): XML -> 내부 타입 매핑 함수
- [src/xml.ts](./src/xml.ts): XML 탐색 유틸리티
- [src/recruiting.ts](./src/recruiting.ts): 채용 도메인 normalized provider

이 디렉터리의 역할은 다음과 같습니다.

- WorkNet URL/파라미터 규칙 캡슐화
- XML 응답 파싱
- raw 응답을 1차 정규화
- 채용 도메인 기준의 source-oriented normalized payload 제공

## Layer Boundary

### Low-level layer

low-level layer는 WorkNet 기능/API 단위로 작동합니다.

- `WorknetApiAdapter`
- `WorknetClient`
- `src/types.ts`

이 레이어는 다음 경우에 사용합니다.

- WorkNet API를 기능별로 직접 호출해야 할 때
- WorkNet 응답을 세밀하게 제어해야 할 때
- source-specific behavior를 integration 레벨에서 다뤄야 할 때

### Normalized recruiting layer

normalized layer는 채용 도메인 기준의 의미 있는 payload를 제공합니다.

- `WorknetRecruitingSourceProvider`
- `WorknetRecruitingProvider`
- `RecruitingSourcePayload`

이 레이어는 다음 경우에 사용합니다.

- 다른 시스템이 WorkNet 원문 구조를 몰라도 채용 source payload를 읽어야 할 때
- source provenance와 payload version이 포함된 중간 계약이 필요할 때
- 이후 각 시스템이 자체 canonical model로 변환할 입력 payload가 필요할 때

이 레이어는 특정 downstream 시스템 전용 모델을 만들지 않습니다.  
책임은 “채용 도메인 normalized ingestion provider”까지입니다.

테스트는 두 층으로 분리합니다.

- 스모크 테스트: [tests/worknet/smoke.mjs](../../../tests/worknet/smoke.mjs)
- 매퍼 단위 테스트: [test/mappers.test.ts](./test/mappers.test.ts)
- provider 단위 테스트: [test/recruiting-provider.test.ts](./test/recruiting-provider.test.ts)

WAS가 최종적으로 프론트엔드에 노출할 서비스 계약은 backend 쪽에 둡니다.
