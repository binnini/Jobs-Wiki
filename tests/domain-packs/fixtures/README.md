# Recruiting Golden Fixtures

이 디렉터리는 recruiting domain pack과 proposal mapper를 함께 검증하기 위한
schema governance fixture 세트를 둡니다.

기본 진입점:

- manifest: [recruiting-golden-fixtures.json](/Users/yebin/workSpace/Jobs-Wiki/tests/domain-packs/fixtures/recruiting-golden-fixtures.json:1)

현재 fixture 종류:

- `worknet_open_recruitment_normal`
  - 정상 WorkNet payload -> 정상 proposal batch
- `worknet_open_recruitment_missing_company`
  - 회사 정보 누락 시 company fact / `posted_by` omission 검증
- `worknet_open_recruitment_missing_role`
  - role label 누락 시 role fact / `for_role` omission 검증
- `worknet_open_recruitment_ambiguous_noisy`
  - noisy whitespace, duplicate jobs, normalized-name fallback, ambiguous field omission 검증
- `recruiting_invalid_missing_title_and_unknown_attribute`
  - 향후 StrataWiki validator / dry-run 테스트용 invalid batch

재사용 원칙:

- `mapped_source` fixture는 source payload와 expected proposal batch를 한 쌍으로 유지합니다.
- `invalid_proposal` fixture는 mapper 출력이 아니라 validator / dry-run 입력으로 재사용합니다.
- future source가 `RSS` 또는 `Gmail`이어도 같은 canonical semantics를 검증하려면
  같은 manifest에 새 `sourceProfile`과 fixture pair를 추가하면 됩니다.
- fixture를 추가할 때는 기존 fixture를 덮어쓰기보다 새 case를 additive하게 넣는 편을 기본으로 합니다.
