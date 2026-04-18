---
status: draft
---

# MVP API Examples

## Purpose

이 문서는 Jobs-Wiki MVP API의 request/response example payload를 정리합니다.

현재 문서 역할:

- endpoint 이름은 `mvp-api-baseline.md`에서 고정
- example payload는 이 문서에서 제공

이 문서는 OpenAPI 문서가 아닙니다.
현재 목적은 frontend와 WAS가 같은 예시를 기준으로 구현을 맞추는 것입니다.

## Scope

현재 MVP 우선 endpoint만 다룹니다.

- `GET /api/workspace/summary`
- `POST /api/workspace/ask`
- `GET /api/opportunities`
- `GET /api/opportunities/{opportunityId}`
- `GET /api/calendar`

## Shared Error Shape

```json
{
  "error": {
    "code": "validation_failed",
    "message": "question is required",
    "retryable": false,
    "details": {
      "field": "question"
    }
  }
}
```

유력 `code`:

- `validation_failed`
- `conflict`
- `not_found`
- `forbidden`
- `temporarily_unavailable`
- `unknown_failure`

## 1. `GET /api/workspace/summary`

### Success Example

```json
{
  "projection": "workspace_summary",
  "sync": {
    "projection": "workspace_summary",
    "visibility": "applied",
    "lastKnownVersion": "ws_2026_04_18_001",
    "lastVisibleAt": "2026-04-18T20:30:00+09:00"
  },
  "profileSnapshot": {
    "targetRole": "Backend Engineer",
    "experience": "1년 (인턴십)",
    "education": "컴퓨터공학과 학사",
    "location": "서울/판교",
    "domain": "금융, 커머스, 플랫폼",
    "skills": ["Node.js", "REST API", "Docker", "SQL", "TypeScript"],
    "sourceSummary": ["Resume_v2.pdf", "Github_Readme.md"]
  },
  "recommendedOpportunities": [
    {
      "opportunityRef": {
        "opportunityId": "opp_toss_core_backend",
        "title": "코어 백엔드 엔지니어 (결제 시스템)"
      },
      "objectRef": {
        "objectId": "job_posting:toss_core_backend",
        "objectKind": "opportunity",
        "title": "코어 백엔드 엔지니어 (결제 시스템)"
      },
      "surface": {
        "title": "코어 백엔드 엔지니어 (결제 시스템)",
        "companyName": "토스페이먼츠",
        "roleLabels": ["Backend", "Payments"],
        "summary": "초당 수천 건의 결제 트래픽을 처리하는 코어 시스템 개발"
      },
      "metadata": {
        "employmentType": "정규직",
        "closesAt": "2026-05-01T23:59:59+09:00",
        "status": "closing_soon"
      },
      "decoration": {
        "urgencyLabel": "D-13",
        "closingInDays": 13,
        "whyMatched": "Node.js 및 API 설계 경험이 직접 연결됩니다."
      }
    },
    {
      "opportunityRef": {
        "opportunityId": "opp_daangn_platform_backend",
        "title": "플랫폼 백엔드 개발자 (공통 인프라)"
      },
      "objectRef": {
        "objectId": "job_posting:daangn_platform_backend",
        "objectKind": "opportunity",
        "title": "플랫폼 백엔드 개발자 (공통 인프라)"
      },
      "surface": {
        "title": "플랫폼 백엔드 개발자 (공통 인프라)",
        "companyName": "당근마켓",
        "roleLabels": ["Backend", "Platform"],
        "summary": "공통 플랫폼 API 및 운영 자동화 환경 설계"
      },
      "metadata": {
        "employmentType": "정규직",
        "closesAt": "2026-05-15T23:59:59+09:00",
        "status": "open"
      },
      "decoration": {
        "urgencyLabel": "D-27",
        "closingInDays": 27,
        "whyMatched": "TypeScript, Docker 경험이 플랫폼 조직과 자연스럽게 맞습니다."
      }
    }
  ],
  "marketBrief": {
    "signals": [
      "플랫폼/백엔드 공고 증가",
      "서울/판교 중심 공고 다수"
    ],
    "risingSkills": ["Go", "Kubernetes"],
    "notableCompanies": ["토스페이먼츠", "당근마켓", "카카오뱅크"]
  },
  "skillsGap": {
    "strong": ["Node.js", "REST API 설계", "RDBMS 모델링"],
    "requested": ["TypeScript", "Docker", "분산 처리"],
    "recommendedToStrengthen": ["Kafka", "Redis", "운영/배포 경험 설명"]
  },
  "actionQueue": [
    {
      "actionId": "action_resume_toss",
      "label": "토스페이먼츠 기준으로 이력서 핵심 문장을 재구성하기",
      "description": "API 최적화 경험을 트래픽 처리와 병목 해소 관점으로 다시 서술합니다.",
      "relatedOpportunityRef": {
        "opportunityId": "opp_toss_core_backend",
        "title": "코어 백엔드 엔지니어 (결제 시스템)"
      }
    }
  ],
  "askFollowUps": [
    "내게 가장 맞는 공고는 무엇인가?",
    "부족한 역량을 4주 안에 어떻게 보완할까?"
  ]
}
```

### Empty Recommendations Example

```json
{
  "projection": "workspace_summary",
  "sync": {
    "projection": "workspace_summary",
    "visibility": "applied"
  },
  "profileSnapshot": {
    "targetRole": "Backend Engineer",
    "experience": "1년 (인턴십)",
    "skills": ["Node.js", "SQL"]
  },
  "recommendedOpportunities": [],
  "marketBrief": {
    "signals": ["검색 조건에 맞는 공고가 현재 적습니다."]
  },
  "skillsGap": {
    "strong": ["Node.js"],
    "requested": ["Docker"],
    "recommendedToStrengthen": ["TypeScript"]
  },
  "actionQueue": [
    {
      "actionId": "action_update_profile",
      "label": "프로필 조건을 완화하거나 선호 도메인을 수정하기"
    }
  ],
  "askFollowUps": ["조건을 완화하면 어떤 공고가 보일까?"]
}
```

### Error Example

```json
{
  "error": {
    "code": "temporarily_unavailable",
    "message": "workspace summary is temporarily unavailable",
    "retryable": true
  }
}
```

## 2. `POST /api/workspace/ask`

### Request Example

```json
{
  "question": "토스페이먼츠 공고 기준으로 인턴십의 API 최적화 경험을 어떻게 더 설득력 있게 연결할 수 있을까?",
  "opportunityId": "opp_toss_core_backend",
  "save": true
}
```

메모:

- 현재 MVP에서 `save`는 reserved field입니다.
- backend는 이를 무시하거나 no-op로 처리할 수 있습니다.

### Success Example

```json
{
  "projection": "ask",
  "sync": {
    "projection": "ask",
    "visibility": "applied"
  },
  "answer": {
    "answerId": "ans_20260418_001",
    "markdown": "### 1. 병목 지점 식별 관점으로 재서술\\n인턴십의 API 응답 속도 개선 경험을 단순 성능 개선이 아니라 병목 구간을 찾고 개선한 사례로 재구성하십시오.\\n\\n### 2. 확장 가능성까지 함께 설명\\n트래픽이 더 커질 경우 어떤 구조적 한계가 있었을지, Redis 또는 비동기 큐를 붙이면 어떤 변화가 가능한지 가설 수준으로 연결하십시오.",
    "generatedAt": "2026-04-18T20:40:00+09:00"
  },
  "evidence": [
    {
      "evidenceId": "ev_profile_001",
      "kind": "personal",
      "label": "인턴십 경력기술서",
      "documentRef": {
        "objectId": "document:resume_internship",
        "objectKind": "document",
        "title": "인턴십_경력기술서.md"
      },
      "excerpt": "결제 API 응답 속도 30% 개선 및 N+1 쿼리 최적화"
    },
    {
      "evidenceId": "ev_job_001",
      "kind": "fact",
      "label": "토스페이먼츠 공고 우대사항",
      "excerpt": "대규모 트래픽 분산 처리 경험 우대"
    }
  ],
  "relatedOpportunities": [
    {
      "opportunityRef": {
        "opportunityId": "opp_daangn_platform_backend",
        "title": "플랫폼 백엔드 개발자 (공통 인프라)"
      },
      "objectRef": {
        "objectId": "job_posting:daangn_platform_backend",
        "objectKind": "opportunity"
      },
      "surface": {
        "title": "플랫폼 백엔드 개발자 (공통 인프라)",
        "companyName": "당근마켓"
      },
      "metadata": {
        "closesAt": "2026-05-15T23:59:59+09:00"
      },
      "decoration": {
        "whyMatched": "플랫폼 API와 운영 자동화 관점에서 비교 가치가 있습니다."
      }
    }
  ],
  "relatedDocuments": [
    {
      "documentRef": {
        "objectId": "document:toss_analysis",
        "objectKind": "document",
        "title": "토스페이먼츠_JD분석.md"
      },
      "role": "note",
      "excerpt": "트랜잭션 무결성과 병목 해결 경험을 강조할 것"
    }
  ]
}
```

### Generic Context Request Example

```json
{
  "question": "내 현재 프로필에서 가장 먼저 보완해야 할 역량은 무엇일까?",
  "save": false
}
```

### Validation Error Example

```json
{
  "error": {
    "code": "validation_failed",
    "message": "question is required",
    "retryable": false,
    "details": {
      "field": "question"
    }
  }
}
```

## 3. `GET /api/opportunities`

### Request Example

```text
GET /api/opportunities?limit=2&status=open&closingWithinDays=30
```

### Success Example

```json
{
  "projection": "opportunity_list",
  "sync": {
    "projection": "opportunity_list",
    "visibility": "applied"
  },
  "items": [
    {
      "opportunityRef": {
        "opportunityId": "opp_toss_core_backend",
        "title": "코어 백엔드 엔지니어 (결제 시스템)"
      },
      "objectRef": {
        "objectId": "job_posting:toss_core_backend",
        "objectKind": "opportunity"
      },
      "surface": {
        "title": "코어 백엔드 엔지니어 (결제 시스템)",
        "companyName": "토스페이먼츠",
        "summary": "초당 수천 건의 결제 트래픽을 처리하는 코어 시스템 개발"
      },
      "metadata": {
        "employmentType": "정규직",
        "closesAt": "2026-05-01T23:59:59+09:00",
        "status": "closing_soon"
      },
      "decoration": {
        "urgencyLabel": "D-13",
        "closingInDays": 13,
        "whyMatched": "Node.js와 API 설계 경험이 직접 연결됩니다."
      }
    },
    {
      "opportunityRef": {
        "opportunityId": "opp_kakaobank_backend",
        "title": "여수신 시스템 백엔드 엔지니어"
      },
      "objectRef": {
        "objectId": "job_posting:kakaobank_backend",
        "objectKind": "opportunity"
      },
      "surface": {
        "title": "여수신 시스템 백엔드 엔지니어",
        "companyName": "카카오뱅크",
        "summary": "금융 트랜잭션을 보장하는 여수신 코어 시스템 개발"
      },
      "metadata": {
        "employmentType": "정규직",
        "closesAt": "2026-04-25T23:59:59+09:00",
        "status": "closing_soon"
      },
      "decoration": {
        "urgencyLabel": "D-7",
        "closingInDays": 7,
        "whyMatched": "판교/금융 도메인 선호와 잘 맞습니다."
      }
    }
  ],
  "nextCursor": "cursor_002"
}
```

### Empty Example

```json
{
  "projection": "opportunity_list",
  "sync": {
    "projection": "opportunity_list",
    "visibility": "applied"
  },
  "items": []
}
```

## 4. `GET /api/opportunities/{opportunityId}`

### Success Example

```json
{
  "projection": "opportunity_detail",
  "sync": {
    "projection": "opportunity_detail",
    "visibility": "applied"
  },
  "item": {
    "opportunityRef": {
      "opportunityId": "opp_toss_core_backend",
      "title": "코어 백엔드 엔지니어 (결제 시스템)"
    },
    "objectRef": {
      "objectId": "job_posting:toss_core_backend",
      "objectKind": "opportunity",
      "title": "코어 백엔드 엔지니어 (결제 시스템)"
    },
    "surface": {
      "title": "코어 백엔드 엔지니어 (결제 시스템)",
      "summary": "초당 수천 건의 결제 트래픽을 처리하는 코어 시스템을 개발하고 유지보수합니다.",
      "descriptionMarkdown": "결제 시스템의 트랜잭션 무결성과 지연 시간 최소화를 목표로 코어 백엔드 시스템을 개발합니다."
    },
    "metadata": {
      "employmentType": "정규직",
      "opensAt": "2026-04-01T09:00:00+09:00",
      "closesAt": "2026-05-01T23:59:59+09:00",
      "status": "closing_soon",
      "source": {
        "provider": "worknet",
        "sourceId": "toss_core_backend_202604",
        "sourceUrl": "https://example.com/toss-core-backend"
      }
    },
    "company": {
      "companyRef": {
        "objectId": "company:toss_payments",
        "objectKind": "company",
        "title": "토스페이먼츠"
      },
      "name": "토스페이먼츠",
      "summary": "국내 주요 결제 인프라를 담당하는 B2B 결제 플랫폼",
      "homepageUrl": "https://www.tosspayments.com",
      "mainBusiness": "결제 인프라"
    },
    "roles": [
      {
        "roleRef": {
          "objectId": "role:backend_engineer",
          "objectKind": "role",
          "title": "Backend Engineer"
        },
        "label": "Backend Engineer"
      }
    ],
    "qualification": {
      "locationText": "서울 강남구",
      "requirementsText": "Node.js 또는 Java/Spring 개발 경험, 대용량 트래픽 처리 경험 우대",
      "selectionProcessText": "서류 > 과제/면접 > 최종합격"
    },
    "analysis": {
      "fitScore": 92,
      "strengthsSummary": "Node.js와 API 설계 경험이 결제 코어 시스템 요구사항과 자연스럽게 연결됩니다.",
      "riskSummary": "Kafka, Redis 기반 분산 처리 경험 설명은 추가 보완이 필요합니다."
    },
    "evidence": [
      {
        "evidenceId": "ev_job_fact_001",
        "kind": "fact",
        "label": "공고 요약 근거",
        "excerpt": "대규모 트래픽 분산 처리 경험 우대"
      }
    ],
    "relatedDocuments": [
      {
        "documentRef": {
          "objectId": "document:toss_analysis",
          "objectKind": "document",
          "title": "토스페이먼츠_JD분석.md"
        },
        "role": "note",
        "excerpt": "트랜잭션 무결성 관점 질문 대비 필요"
      }
    ]
  }
}
```

### Not Found Example

```json
{
  "error": {
    "code": "not_found",
    "message": "opportunity not found",
    "retryable": false,
    "details": {
      "opportunityId": "opp_unknown"
    }
  }
}
```

## 5. `GET /api/calendar`

### Request Example

```text
GET /api/calendar?from=2026-04-18&to=2026-05-31
```

### Success Example

```json
{
  "projection": "calendar",
  "sync": {
    "projection": "calendar",
    "visibility": "applied"
  },
  "items": [
    {
      "calendarItemId": "cal_opp_kakaobank_deadline",
      "kind": "opportunity_deadline",
      "label": "카카오뱅크 여수신 시스템 백엔드 엔지니어 마감",
      "startsAt": "2026-04-25T23:59:59+09:00",
      "objectRef": {
        "objectId": "job_posting:kakaobank_backend",
        "objectKind": "opportunity",
        "title": "여수신 시스템 백엔드 엔지니어"
      },
      "decoration": {
        "urgencyLabel": "D-7",
        "companyName": "카카오뱅크"
      }
    },
    {
      "calendarItemId": "cal_opp_toss_deadline",
      "kind": "opportunity_deadline",
      "label": "토스페이먼츠 코어 백엔드 엔지니어 마감",
      "startsAt": "2026-05-01T23:59:59+09:00",
      "objectRef": {
        "objectId": "job_posting:toss_core_backend",
        "objectKind": "opportunity",
        "title": "코어 백엔드 엔지니어 (결제 시스템)"
      },
      "decoration": {
        "urgencyLabel": "D-13",
        "companyName": "토스페이먼츠"
      }
    }
  ]
}
```

### Empty Example

```json
{
  "projection": "calendar",
  "sync": {
    "projection": "calendar",
    "visibility": "applied"
  },
  "items": []
}
```

## Relationship to Other Docs

이 문서는 아래 문서와 함께 봅니다.

- `docs/api/mvp-api-baseline.md`
- `docs/product/ui-screen-spec.md`
- `docs/product/ui-state-spec.md`
- `docs/architecture/frontend-view-model.md`
