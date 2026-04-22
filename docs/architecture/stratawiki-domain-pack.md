---
status: draft
---

# StrataWiki Domain Pack

## Purpose

이 문서는 `StrataWiki`의 domain semantics를 core Python code 안에 하드코딩하지 않고,
외부 product/domain owner가 등록할 수 있는 `Domain Pack`으로 분리하는 초안을 정리합니다.

특히 아래 질문에 답하는 것이 목적입니다.

- `Jobs-Wiki`가 recruiting domain 책임을 어디까지 가져갈 수 있는가
- `StrataWiki`는 어떤 최소 primitive만 core로 유지해야 하는가
- "범용 knowledge engine"과 "도메인별 canonical model"을 어떻게 분리할 수 있는가
- 현재 `SourceRecord -> DomainIngestionPlugin -> Fact/Relation` 구조와 무엇이 달라지는가

이 문서는 "모든 domain semantics를 없앤다"는 주장을 하지 않습니다.
대신 domain semantics의 위치를 `StrataWiki core code`에서 `versioned domain definition`으로 옮기는 것을 목표로 합니다.

## Current Problem

현재 `StrataWiki`의 core ingestion contract는 작습니다.

- common `SourceRecord`
- domain-specific `DomainIngestionPlugin`
- plugin이 `FactRecord`와 `FactRelation` 생성

하지만 실제 semantics는 plugin code에 들어 있습니다.

현재 recruiting plugin은 아래를 이미 알고 있어야만 합니다.

- `posting`
- `company`
- `jobs`
- `recruitment_sections`
- `selection_steps`
- 어떤 field가 `job_posting`이 되어야 하는지
- 어떤 canonical key를 만들어야 하는지
- 어떤 relation을 생성해야 하는지

즉 surface는 generic하지만, 실제 canonical model은 code에 고정돼 있습니다.

이 구조의 문제:

- domain owner가 바뀔 때마다 `StrataWiki` code를 수정해야 합니다.
- `Jobs-Wiki` 같은 외부 product가 domain semantics를 소유하기 어렵습니다.
- 새로운 source kind를 붙일수록 plugin이 source-aware parser로 비대해집니다.
- core와 domain pack이 같이 배포되므로 범용성과 릴리즈 독립성이 떨어집니다.

## Design Goal

목표는 아래처럼 재구성하는 것입니다.

```text
StrataWiki core
  = generic ontology/fact engine
  = validator / canonicalizer / snapshot engine

Domain Pack
  = domain vocabulary
  = entity / relation schema
  = identity / merge rules
  = proposal validation rules
  = projection hints
  = interpretation grammar guidance

Jobs-Wiki
  = recruiting domain pack owner
  = source interpretation owner
  = proposal producer
```

핵심은:

- `StrataWiki`는 domain의 "존재"를 압니다.
- 하지만 domain의 상세 shape는 code가 아니라 pack에서 읽습니다.
- `Jobs-Wiki`는 "어떤 Fact를 만들고 싶은지" proposal로 보냅니다.
- `StrataWiki`는 registered pack 기준으로만 승인합니다.

## Domain Pack Shape

권장 최소 구조는 아래 6개 조각입니다.

### 1. Manifest

pack의 정체성과 버전을 정의합니다.

```ts
type DomainPackManifest = {
  domain: string;
  packVersion: string;
  compatibility: {
    minStrataWikiVersion: string;
  };
  owner: {
    system: string;
    team?: string;
  };
};
```

### 2. Entity Types

어떤 canonical entity가 허용되는지 정의합니다.

```ts
type EntityTypeDefinition = {
  name: string;
  description?: string;
  attributes: Record<string, AttributeDefinition>;
  requiredAttributes: string[];
  identity: IdentityRule;
  mergePolicy: MergePolicy;
};
```

### 3. Relation Types

어떤 canonical relation이 허용되는지 정의합니다.

```ts
type RelationTypeDefinition = {
  name: string;
  fromEntityTypes: string[];
  toEntityTypes: string[];
  attributes?: Record<string, AttributeDefinition>;
  cardinality?: "one_to_one" | "one_to_many" | "many_to_many";
  evidencePolicy?: "required" | "optional";
};
```

### 4. Identity Rules

canonical key를 어떻게 만들지 정의합니다.

```ts
type IdentityRule =
  | {
      mode: "external_id";
      field: string;
      prefix: string;
    }
  | {
      mode: "composite";
      fields: string[];
      prefix: string;
      normalization: Array<"trim" | "lowercase" | "slugify">;
    };
```

### 5. Proposal Schema

외부 producer가 어떤 proposal을 보낼 수 있는지 정의합니다.

```ts
type ProposalSurfaceDefinition = {
  accepts: {
    factProposal: boolean;
    relationProposal: boolean;
  };
  strictUnknownAttributes: boolean;
  batchMode: "atomic" | "partial";
};
```

### 6. Projection Hints

core truth와 별개로, read-side가 어떤 label과 family를 쓰면 좋은지 힌트를 줍니다.

```ts
type ProjectionHints = {
  defaultTitleAttribute?: Record<string, string>;
  searchableAttributes?: Record<string, string[]>;
  defaultFamilies?: string[];
};
```

## Full Pack Example

아래는 `Jobs-Wiki`가 소유할 수 있는 `recruiting` domain pack의 축약 예시입니다.

```json
{
  "manifest": {
    "domain": "recruiting",
    "packVersion": "2026-04-22",
    "compatibility": {
      "minStrataWikiVersion": "0.2.0"
    },
    "owner": {
      "system": "jobs-wiki",
      "team": "career-knowledge"
    }
  },
  "proposalSurface": {
    "accepts": {
      "factProposal": true,
      "relationProposal": true
    },
    "strictUnknownAttributes": true,
    "batchMode": "atomic"
  },
  "entityTypes": {
    "job_posting": {
      "requiredAttributes": ["title"],
      "attributes": {
        "title": { "type": "string" },
        "summary": { "type": "markdown" },
        "employment_type": { "type": "string" },
        "starts_at": { "type": "datetime" },
        "closes_at": { "type": "datetime" },
        "status": { "type": "string", "enum": ["active", "closed", "archived"] },
        "source_url": { "type": "url" }
      },
      "identity": {
        "mode": "external_id",
        "field": "source_id",
        "prefix": "job_posting"
      },
      "mergePolicy": {
        "mode": "upsert",
        "conflictStrategy": "prefer_newer_source"
      }
    },
    "company": {
      "requiredAttributes": ["name"],
      "attributes": {
        "name": { "type": "string" },
        "normalized_name": { "type": "string" },
        "homepage_url": { "type": "url" },
        "business_number": { "type": "string" }
      },
      "identity": {
        "mode": "composite",
        "fields": ["normalized_name"],
        "prefix": "company",
        "normalization": ["trim", "lowercase", "slugify"]
      },
      "mergePolicy": {
        "mode": "upsert",
        "conflictStrategy": "manual_review"
      }
    },
    "role": {
      "requiredAttributes": ["display_name"],
      "attributes": {
        "display_name": { "type": "string" },
        "normalized_name": { "type": "string" },
        "source_code": { "type": "string" }
      },
      "identity": {
        "mode": "composite",
        "fields": ["normalized_name"],
        "prefix": "role",
        "normalization": ["trim", "lowercase", "slugify"]
      },
      "mergePolicy": {
        "mode": "upsert",
        "conflictStrategy": "prefer_existing"
      }
    }
  },
  "relationTypes": {
    "posted_by": {
      "fromEntityTypes": ["job_posting"],
      "toEntityTypes": ["company"],
      "cardinality": "many_to_many",
      "evidencePolicy": "required"
    },
    "for_role": {
      "fromEntityTypes": ["job_posting"],
      "toEntityTypes": ["role"],
      "cardinality": "many_to_many",
      "evidencePolicy": "required"
    }
  },
  "projectionHints": {
    "defaultTitleAttribute": {
      "job_posting": "title",
      "company": "name",
      "role": "display_name"
    },
    "searchableAttributes": {
      "job_posting": ["title", "summary"],
      "company": ["name"],
      "role": ["display_name"]
    },
    "defaultFamilies": ["opportunity", "company", "role"]
  }
}
```

## Proposal Contract

이 구조에서는 `Jobs-Wiki`가 raw source가 아니라 proposal을 보냅니다.

```ts
type FactProposal = {
  proposalId: string;
  domain: string;
  entityType: string;
  attributes: Record<string, unknown>;
  identityHints?: {
    source_id?: string;
    external_id?: string;
  };
  evidence: Array<{
    connector: string;
    sourceId: string;
    pointer?: string;
  }>;
};

type RelationProposal = {
  proposalId: string;
  domain: string;
  relationType: string;
  fromRef: ProposalEntityRef;
  toRef: ProposalEntityRef;
  attributes?: Record<string, unknown>;
  evidence: Array<{
    connector: string;
    sourceId: string;
    pointer?: string;
  }>;
};

type DomainProposalBatch = {
  domain: string;
  packVersion: string;
  producer: string;
  facts: FactProposal[];
  relations: RelationProposal[];
};
```

중요한 점:

- proposal은 `FactRecord`가 아닙니다.
- canonical key는 외부가 직접 확정하지 않습니다.
- 외부는 candidate attributes와 identity hint를 제안합니다.
- `StrataWiki`는 pack의 identity rule로 canonical key를 계산합니다.

## StrataWiki Runtime

`StrataWiki` core는 아래 primitive만 강하게 소유합니다.

- domain pack registry
- proposal validator
- canonical key resolver
- dedupe / merge engine
- provenance attach
- snapshot publish
- read/query/retrieval engine

즉 runtime은 아래처럼 바뀝니다.

```text
Jobs-Wiki
  -> register recruiting domain pack
  -> send recruiting proposal batch

StrataWiki
  -> load recruiting pack
  -> validate entity/relation types
  -> validate attributes
  -> resolve canonical keys
  -> detect conflicts
  -> publish Fact / Relation / Snapshot
```

권장 core interface 예시:

```python
class DomainPackRegistry(Protocol):
    def register(self, pack: DomainPack) -> None: ...
    def get(self, domain: str, pack_version: str | None = None) -> DomainPack: ...


class ProposalIngestionService(Protocol):
    def validate(self, batch: DomainProposalBatch) -> ValidationReport: ...
    def ingest(self, batch: DomainProposalBatch) -> IngestionReceipt: ...
```

## What Jobs-Wiki Owns

이 구조에서 `Jobs-Wiki`가 소유하는 것은 아래입니다.

- recruiting `Domain Pack`
- source interpretation
- source-to-proposal mapping
- domain-specific LLM extraction prompt
- proposal quality tests

즉 `Jobs-Wiki`는 "채용 도메인에서 무엇을 Fact 후보로 볼 것인지"를 정의합니다.

## What StrataWiki Owns

반대로 `StrataWiki`가 소유하는 것은 아래입니다.

- generic fact engine
- schema validation
- canonical identity resolution
- merge / conflict policy execution
- provenance / snapshot
- interpretation / personal retrieval

즉 `StrataWiki`는 "그 후보를 실제 canonical truth로 올려도 되는지"를 판단합니다.

## What Changes From Today

현재와 비교하면 차이는 단순히 "proposal을 외부에서 받는다"가 아닙니다.

### 1. Domain semantics의 위치가 바뀝니다.

현재:

- semantics가 `StrataWiki` Python plugin code에 들어 있습니다.
- `RecruitingSourceIngestionPlugin`이 entity type, relation type, key rule을 모두 직접 압니다.

제안:

- semantics는 `Domain Pack` artifact에 들어 있습니다.
- `StrataWiki`는 pack을 해석하는 generic engine이 됩니다.

### 2. `SourceRecord` 중심에서 `ProposalBatch` 중심으로 바뀝니다.

현재:

- 외부는 `SourceRecord`만 넘깁니다.
- core 내부 plugin이 raw-ish structured payload를 읽고 Fact를 만듭니다.

제안:

- 외부는 domain-aware `FactProposal`과 `RelationProposal`을 만듭니다.
- core는 proposal을 canonical truth로 승격할지 판단합니다.

### 3. domain ownership이 이동합니다.

현재:

- recruiting semantics는 사실상 `StrataWiki` repo가 소유합니다.

제안:

- recruiting semantics는 `Jobs-Wiki`가 소유할 수 있습니다.
- `StrataWiki`는 recruiting 자체를 몰라도 pack만 읽으면 됩니다.

### 4. hardcoding이 사라지는 것이 아니라 위치가 바뀝니다.

현재:

- hardcoding 위치 = `StrataWiki` Python code

제안:

- hardcoding 위치 = versioned domain pack definition

이 차이가 중요합니다.
code hardcoding은 core release와 강하게 묶이지만,
pack hardcoding은 domain owner가 독립적으로 관리할 수 있습니다.

### 5. rejection의 의미가 달라집니다.

현재:

- plugin이 내부에서 parse 실패하거나 validation 실패

제안:

- "이 proposal은 registered pack 기준으로 승인 불가"가 됩니다.
- 즉 rejection은 parser failure가 아니라 contract enforcement에 가까워집니다.

## Why This Is Better

이 방식의 장점:

- `StrataWiki` core가 더 작고 범용적으로 유지됩니다.
- `Jobs-Wiki`가 recruiting semantics를 직접 통제할 수 있습니다.
- domain을 추가할 때 core 수정 없이 pack 등록으로 확장 가능합니다.
- source별 차이는 `Jobs-Wiki` adapter와 extractor에서 흡수됩니다.
- LLM을 써도 output을 pack schema로 강제할 수 있습니다.

## New Risks

물론 리스크도 생깁니다.

- `Jobs-Wiki`가 domain pack을 잘못 설계하면 잘못된 canonical model이 굳어질 수 있습니다.
- pack version migration이 필요해집니다.
- pack이 너무 product-specific하면 domain이 아니라 UI schema가 될 수 있습니다.
- generic engine이 pack 표현력을 충분히 지원해야 합니다.

즉 core code의 하드코딩을 걷어낸 대신,
"schema governance" 문제가 새로 생깁니다.

하지만 이 문제는 현재 구조보다 더 좋은 문제입니다.
왜냐하면 지금은 governance조차 code patch로만 가능하기 때문입니다.

## Suggested Migration

한 번에 다 바꾸기보다 아래 순서가 안전합니다.

1. `StrataWiki`에 `DomainPackRegistry`를 추가합니다.
2. recruiting plugin이 직접 rules를 들고 있지 않고, pack을 읽도록 바꿉니다.
3. `Jobs-Wiki`가 recruiting pack artifact를 소유합니다.
4. `Jobs-Wiki`가 source envelope 대신 proposal batch를 생성하도록 확장합니다.
5. `StrataWiki`는 source ingest와 proposal ingest를 한동안 병행합니다.
6. 안정화되면 source-specific recruiting plugin 코드를 축소합니다.

## Bottom Line

`Domain Pack` 방식은 domain별 하드코딩을 없애는 설계가 아닙니다.
대신 그 하드코딩을 `StrataWiki core implementation`에서 떼어내어,
외부 product가 소유하는 `registered, versioned, governable domain artifact`로 옮기는 설계입니다.

이게 현재 구조와 가장 큰 차이입니다.
