---
status: draft
---

# UI Screen Spec

## Purpose

이 문서는 Jobs-Wiki의 현재 UI를 화면 단위로 명세합니다.

기존 wireframe 문서가 layout과 reading order를 설명한다면,
이 문서는 아래를 더 직접적으로 고정하는 것이 목적입니다.

- 각 화면의 역할
- 사용자가 이 화면에서 해결해야 하는 질문
- 어떤 데이터가 이 화면에 필요하고, 어디서 오는지
- 어떤 CTA가 있어야 하는지
- 어떤 화면으로 이동해야 하는지

이 문서는 visual polish나 세부 스타일을 확정하지 않습니다.
현재 목적은 frontend 구현과 WAS 계약 연결을 쉽게 만드는 것입니다.

## Current Flow

현재 기준 화면 흐름은 아래와 같습니다.

1. `Onboarding`
2. `Extraction Review`
3. `Baseline Report`
4. `Opportunity Detail`
5. `Ask Workspace`
6. `Calendar`
7. `Workspace`

현재 우선 구현 slice는 아래 화면입니다.

- `Baseline Report`
- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

아래 화면은 onboarding/supporting flow로 유지합니다.

- `Onboarding`
- `Extraction Review`
- `Workspace`

## Screen Inventory

| Screen | Role | Priority |
| --- | --- | --- |
| Onboarding | 사용자 입력 수집 | Secondary |
| Extraction Review | 추출 결과 확인 | Secondary |
| Baseline Report | 첫 홈 / 메인 브리핑 | Primary |
| Opportunity Detail | 지원 판단용 상세 | Primary |
| Ask Workspace | 리포트 확장형 분석 | Primary |
| Calendar | 마감 일정 확인 | Primary |
| Workspace | 저장 문서/노트 관리 | Secondary |

## 1. Onboarding

### Role

- 사용자의 기본 프로필과 입력 소스를 수집합니다.
- 이후 리포트 생성의 기준이 되는 최소 입력을 확보합니다.

### User Questions

- 무엇을 입력해야 하는가
- 이 시스템은 입력된 정보를 가지고 무엇을 해주는가

### Entry

- 첫 진입
- 새 프로필 시작

### Required Input

- 목표 직무
- 경력 수준
- 최종 학력
- 선호 지역
- 관심 산업/도메인
- 이력서/포트폴리오 파일
- 추가 목표 / 고려 사항

### Main Blocks

- 서비스 소개 / 기대 결과 설명
- 업로드 영역
- 구조화 입력 폼
- 분석 시작 CTA

### Primary CTA

- `프로필 분석 및 리포트 생성하기`

### Exit

- `Extraction Review`

## 2. Extraction Review

### Role

- 문서와 입력값에서 추출된 profile snapshot을 확인합니다.
- 잘못 해석된 내용이 있으면 리포트 진입 전에 교정합니다.

### User Questions

- 시스템이 나를 어떻게 해석했는가
- 이대로 리포트를 생성해도 되는가

### Entry

- `Onboarding` 완료 직후

### Required Data

- 목표 직무
- 경력 수준
- 식별된 기술
- 도출된 강점
- 분석 신뢰도

### Main Blocks

- 추출 결과 요약 헤더
- 핵심 프로필 필드
- 보유 기술 chip list
- 핵심 강점 목록
- 수정 CTA / 승인 CTA

### Primary CTA

- `확인 완료 및 기본 리포트 보기`

### Exit

- `Baseline Report`

## 3. Baseline Report

### Role

- onboarding 직후 보여주는 첫 홈 화면입니다.
- 사용자가 현재 상황, 추천 공고, 다음 액션을 한 번에 이해하도록 합니다.

### User Questions

- 시스템이 내 프로필을 어떻게 이해했는가
- 지금 어떤 공고가 중요한가
- 내가 무엇부터 해야 하는가

### Entry

- `Extraction Review` 완료 직후
- 사이드바에서 `기본 분석 리포트` 재진입

### Required Data

- `GET /api/workspace/summary`
- 필요 시 연관 공고 진입용 `GET /api/opportunities`

### Main Blocks

- Hero summary
- Personal Snapshot
- Recommended Opportunities
- Action Queue
- Market Brief
- Skills Gap
- Ask follow-up entry

### Main Content Rule

- 가장 큰 메인 블록은 항상 `추천 공고`입니다.
- `개인 요약`은 신뢰 형성용입니다.
- `액션 큐`는 행동 전환용입니다.

### Primary CTA

- 공고 카드의 `상세 보기`
- 액션 큐 내 `심층 분석하기`

### Secondary CTA

- `프로필 편집`
- `리포트 저장`
- `Ask Workspace` 진입

### Exit

- `Opportunity Detail`
- `Ask Workspace`
- `Calendar`

## 4. Opportunity Detail

### Role

- 단일 공고를 지원 판단 관점에서 읽는 상세 화면입니다.
- 공고 내용, 회사 맥락, 적합도 분석, 리스크를 함께 제공합니다.

### User Questions

- 이 공고는 어떤 역할과 환경을 의미하는가
- 왜 나와 맞는가
- 어디가 부족한가
- 지금 지원해도 되는가

### Entry

- `Baseline Report` 추천 공고 카드
- `Calendar` 일정 항목
- `Ask Workspace` 연관 공고
- `Workspace` 내부 공고 문서 링크

### Required Data

- `GET /api/opportunities/{opportunityId}`

### Main Blocks

- 공고 헤더
- 기업 및 도메인 컨텍스트
- 직무 요약
- 핵심 자격 요건
- 적합도 분석
- 긍정 요소 / 리스크
- AI 면접 시나리오 진입점

### Primary CTA

- `지원 준비 시작하기`
- `이 공고를 워크스페이스에서 이어서 분석`

### Secondary CTA

- `관심 공고 저장`
- `기본 리포트로 돌아가기`

### Exit

- `Ask Workspace`
- `Baseline Report`

## 5. Ask Workspace

### Role

- 기본 리포트와 공고 상세를 확장하는 심층 분석 화면입니다.
- 질문, 답변, 근거, 연관 공고를 한 화면에서 다룹니다.

### User Questions

- 내 경험을 어떻게 더 설득력 있게 연결할 수 있는가
- 지금 부족한 역량은 무엇인가
- 이 공고와 다른 공고를 어떻게 비교해야 하는가

### Entry

- `Baseline Report` follow-up CTA
- `Opportunity Detail`의 이어서 분석 CTA
- 사이드바에서 직접 진입

### Required Data

- `POST /api/workspace/ask`
- optional `GET /api/opportunities`
- active context가 있을 경우 selected `opportunityId`

### Required Interaction Rule

- 공고 컨텍스트 없이 들어올 수 있습니다.
- 공고 컨텍스트와 함께 들어오면 해당 공고 중심 분석을 우선합니다.
- 답변은 최소한 `answer`, `evidence`, `related opportunities`를 보여줄 수 있어야 합니다.

### Main Blocks

- 현재 분석 기준
- 메인 분석 패널
- 근거 자료 패널
- 연관 추천 공고 비교
- 후속 분석 제안

### Primary CTA

- 분석 질문 전송
- 연관 공고 기준으로 분석 전환

### Secondary CTA

- 연관 공고 `상세 보기`
- 후속 분석 제안 클릭

### Exit

- `Opportunity Detail`
- 동일 화면 내 컨텍스트 전환

## 6. Calendar

### Role

- 공고 마감 일정을 시간 순서로 확인합니다.
- 타임라인과 월간 캘린더 view를 모두 제공합니다.

### User Questions

- 어떤 공고가 가장 먼저 마감되는가
- 이번 주에 먼저 봐야 할 일정은 무엇인가

### Entry

- 사이드바 `지원 일정 관리`
- `Baseline Report`의 일정 관련 CTA

### Required Data

- `GET /api/calendar`

### Main Blocks

- 화면 헤더
- view mode toggle
- timeline list
- monthly calendar grid

### Primary CTA

- 일정 항목 `상세 보기`

### Exit

- `Opportunity Detail`

## 7. Workspace

### Role

- 공고 분석 문서, 개인 노트, 기술 개념 정리 같은 자산을 저장하고 읽습니다.
- 현재 단계에서는 PKM 전체 구현보다 문서/노트 관리를 우선합니다.

### User Questions

- 저장한 분석 자료를 어디서 다시 보나
- 공고별 정리 문서를 어떻게 관리하나

### Entry

- 사이드바 `커리어 자산 저장소`

### Required Data

- 현재 MVP에서는 mock/static 가능
- 장기적으로는 document/tree projection 필요

### Main Blocks

- 파일 트리
- 문서 뷰어
- 문서 검색
- 관련 분석 실행 CTA

### Primary CTA

- 문서 열기
- 심층 분석 워크스페이스에서 열기

### Exit

- `Ask Workspace`
- `Opportunity Detail`

## Navigation Rules

현재 1차 navigation은 아래처럼 둡니다.

- `기본 분석 리포트`
- `심층 분석 워크스페이스`
- `지원 일정 관리`
- `커리어 자산 저장소`

규칙:

- `기본 분석 리포트`가 기본 홈입니다.
- `Ask`는 별도 홈이 아니라 리포트 확장 행동입니다.
- `Workspace`는 후속 관리 공간입니다.

## CTA Discipline

각 화면의 CTA는 아래 규칙을 따릅니다.

- 한 화면의 primary CTA는 1~2개를 넘기지 않습니다.
- `상세 보기`, `이어서 분석`, `리포트 보기`처럼 다음 화면이 명확한 문구를 사용합니다.
- 추상적인 문구보다 행동이 드러나는 문구를 우선합니다.

## Out of Scope for This Doc

이 문서가 다루지 않는 것:

- component 단위 설계
- Tailwind/class 수준 스타일 규칙
- loading / empty / error / stale의 상세 상태 매트릭스
- view-model field mapping 표

이 항목들은 별도 문서로 분리하는 편이 맞습니다.

## Recommended Next Docs

이 문서 다음으로 추가하면 좋은 문서:

1. `ui-state-spec.md`
2. `frontend-view-model.md`

