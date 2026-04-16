# WORKNET API Reference

고용24 OPEN-API 스크랩 원문을 개발용 레퍼런스로 재구성한 문서입니다.

- 정제본: `docs/THIRD-PARTY/WORKNET_API.md`
- 원문 보존본: `docs/THIRD-PARTY/WORKNET_API_RAW.md`

## 문서 목적

이 문서는 원문 스크랩에서 바로 쓰기 어려운 정보를 다음 기준으로 압축했습니다.

- 어떤 API가 있는지 빠르게 찾기
- 목록 응답에서 어떤 식별자를 꺼내 상세 조회로 이어갈지 확인하기
- 공통 파라미터와 호출 규칙을 한 번에 파악하기
- 응답 루트 노드와 핵심 필드를 먼저 이해하기

원문의 전체 필드 정의, 세부 코드표, 설명 문구가 필요하면 `WORKNET_API_RAW.md`를 참고합니다.

## 공통 규칙

### 기본 URL 패턴

- 채용/직업/학과/강소기업 계열: `https://www.work24.go.kr/cm/openApi/call/wk/...`
- 훈련과정 계열: `https://www.work24.go.kr/cm/openApi/call/hr/...`

### 인증과 반환 형식

- 거의 모든 API에서 `authKey`가 필수입니다.
- 채용/직업/학과/강소기업 계열은 사실상 `returnType=XML` 고정으로 보는 편이 안전합니다.
- 훈련과정 계열은 원문상 `XML, JSON` 모두 가능하다고 적혀 있지만, 스크랩 기준 스키마는 XML 기준입니다.

### 페이징

- `startPage` 또는 `pageNum`: 기본 1, 최대 1000
- `display` 또는 `pageSize`: 기본 10, 최대 100

### 목록/상세 구분

- 채용정보 일부 API는 `callTp=L|D`를 같이 넘깁니다.
- 훈련과정 API는 `outType=1|2`를 사용합니다.
- 직업정보 상세군은 URL 자체가 분리되어 있지만 `target=JOBDTL`, `jobGb=1`, `dtlGb` 조합을 같이 사용합니다.

### 다중 검색

- 원문에 `(다중검색 가능)`으로 표시된 값은 `a|b|c` 형식입니다.

### 개발 시 추천 파싱 전략

- 1차: 목록 API로 검색
- 2차: 목록 결과에서 식별자 추출
- 3차: 상세 API 또는 세부 분할 API 호출
- XML 응답은 "루트 노드", "배열 노드", "아이템 노드"를 먼저 고정한 뒤 매핑합니다.

## 빠른 인덱스

| 분류 | 목적 | 대표 식별자 |
| --- | --- | --- |
| 채용정보 | 채용행사, 공채속보, 공채기업 | `eventNo`, `empSeqno`, `empCoNo` |
| 훈련과정 | HRD 계열 과정/기관/일정 | `trprId`, `trprDegr`, `torgId` |
| 프로그램 | 구직자 취업역량 프로그램 | 별도 상세 식별자 없음 |
| 강소기업 | 강소기업, 탐방기, 청년체험, 청년친화 강소기업 | `busiNo`, `wantedAuthNo` |
| 학과정보 | 학과 목록 및 상세 | `majorGb`, `empCurtState1Id`, `empCurtState2Id` |
| 직업정보 | 직업 목록 및 7종 상세 | `jobCd` |

## 1. 채용정보

### 1-1. 채용행사

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo210L11.do` | 채용행사 검색 | `callTp=L`, `startPage`, `display`, `srchBgnDt`, `srchEndDt`, `keyword`, `areaCd` | `empEventList` |
| 상세 | `wk/callOpenApiSvcInfo210D11.do` | 행사 상세 조회 | `callTp=D`, `areaCd`, `eventNo` | `empEventDtl` |

목록 핵심 필드:

- `eventNo`: 상세 조회 키
- `areaCd`: 상세 조회에 같이 필요
- `eventNm`, `eventTerm`, `startDt`

상세 핵심 필드:

- `eventPlc`, `joinCoWantedInfo`, `subMatter`, `inqTelNo`, `charger`, `email`

지역코드:

- `51` 서울/강원
- `52` 부산/경남
- `53` 대구/경북
- `54` 경기/인천
- `55` 광주/전라/제주
- `56` 대전/충청

### 1-2. 공채속보

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo210L21.do` | 공채 공고 검색 | `callTp=L`, `startPage`, `display`, `coClcd`, `empWantedTypeCd`, `empWantedCareerCd`, `jobsCd`, `empWantedTitle`, `empWantedEduCd`, `sortField`, `sortOrderBy`, `busino` | `dhsOpenEmpInfoList` |
| 상세 | `wk/callOpenApiSvcInfo210D21.do` | 공채 공고 상세 | `callTp=D`, `empSeqno`, `empSelfintroOfferYn`, `empSelsOfferYn`, `empRecrOfferYn` | `dhsOpenEmpInfoDetailRoot` |

목록 핵심 필드:

- `empSeqno`: 상세 조회 키
- `empWantedTitle`, `empBusiNm`, `coClcdNm`, `empWantedStdt`, `empWantedEndt`
- `empWantedHomepgDetail`, `empWantedMobileUrl`

상세 핵심 필드:

- 기본 공고 정보: `empWantedTitle`, `empSubmitDocCont`, `empRcptMthdCont`, `inqryCont`
- 직종 목록: `empJobsList.empJobsListInfo`
- 자기소개서 문항: `empSelsList.empSelsListInfo.selfintroQstCont`
- 전형 단계: `empSelsList.empSelsListInfo.selsNm`
- 모집 포지션: `empRecrList.empRecrListInfo`
- 첨부파일: `regFileList.regFileListInfo`

공통 코드:

- 기업구분 `coClcd`: `10` 대기업, `20` 공기업, `30` 공공기관, `40` 중견기업, `50` 외국계기업
- 고용형태 `empWantedTypeCd`: `10` 정규직, `20` 정규직전환, `30` 비정규직, `40` 기간제, `50` 시간선택제, `60` 기타
- 경력구분 `empWantedCareerCd`: `10` 경력무관, `20` 경력, `30` 신입, `40` 인턴
- 학력 `empWantedEduCd`: `10` 고졸, `20` 전문대졸, `30` 대졸, `40` 석사, `50` 박사, `99` 무관

### 1-3. 공채기업정보

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo210L31.do` | 공채기업 검색 | `callTp=L`, `startPage`, `display`, `coClcd`, `sortField`, `sortOrderBy`, `coNm` | `dhsOpenEmpHireInfoList` |
| 상세 | `wk/callOpenApiSvcInfo210D31.do` | 기업 상세 조회 | `callTp=D`, `empCoNo` | `dhsOpenEmpHireInfoDetailRoot` |

목록 핵심 필드:

- `empCoNo`: 상세 조회 키
- `coNm`, `coClcdNm`, `busino`, `mapCoorY`, `mapCoorX`, `homepg`

상세 핵심 필드:

- 기업 소개: `coIntroSummaryCont`, `coIntroCont`, `mainBusiCont`
- 복리후생: `welfareList.welfareListInfo`
- 연혁: `historyList.historyListInfo`
- 인재상: `rightPeopleList.rightPeopleListInfo`

## 2. 훈련과정 계열

훈련과정 계열은 구조가 거의 같습니다.

- 목록: 과정 검색
- 과정/기관정보: 과정 상세 + 기관/시설/장비
- 훈련일정: 회차별 일정/정원/취업률

상세 조회에 자주 필요한 키:

- `trprId`: 훈련과정 ID
- `trprDegr`: 훈련회차
- `torgId` 또는 `trainstCstId`: 훈련기관 ID

### 2-1. 공통 요청 패턴

목록 공통 필수값:

- `authKey`
- `returnType`
- `outType=1`
- `pageNum`
- `pageSize`
- `srchTraStDt`
- `srchTraEndDt`
- `sort`
- `sortCol`

상세 공통 필수값:

- `authKey`
- `returnType`
- `outType=2`
- `srchTrprId`
- `srchTrprDegr` 또는 선택
- `srchTorgId` 또는 기관 ID

공통 필터 축:

- 지역: `srchTraArea1`, `srchTraArea2`
- NCS: `srchNcs1` ~ `srchNcs4`
- 훈련유형: `crseTracseSe`
- 훈련구분: `srchTraGbn`
- 훈련종류: `srchTraType`
- 과정명/기관명: `srchTraProcessNm`, `srchTraOrganNm`

목록 응답 핵심 필드:

- `title`, `subTitle`
- `titleLink`, `subTitleLink`
- `traStartDate`, `traEndDate`
- `trainstCstId`, `trprId`, `trprDegr`
- `realMan`, `yardMan`, `regCourseMan`

과정/기관정보 응답 핵심 블록:

- `inst_base_info`
- `inst_detail_info`
- `inst_facility_info.inst_facility_info_list`
- `inst_eqnm_info.inst_eqnm_info_list`

훈련일정 응답 핵심 필드:

- `trprId`, `trprDegr`, `trprNm`
- `trStaDt`, `trEndDt`
- `totFxnum`, `totParMks`, `totTrco`
- `eiEmplRate3`, `eiEmplRate6`, `hrdEmplRate6`

취업률 상태값:

- `A` 개설예정
- `B` 진행중
- `C` 미실시
- `D` 수료자 없음

### 2-2. 국민내일배움카드 훈련과정

| API | URL | 응답 루트 |
| --- | --- | --- |
| 목록 | `hr/callOpenApiSvcInfo310L01.do` | `HRDNet` |
| 과정/기관정보 | `hr/callOpenApiSvcInfo310L02.do` | `HRDNet` |
| 훈련일정 | `hr/callOpenApiSvcInfo310L03.do` | `HRDNet` |

특이 필터:

- `wkendSe`: `1` 주말, `2` 혼합, `3` 주중, `9` 해당없음
- `crseTracseSe`: 국민내일배움카드, 국가기간전략산업직종, K-디지털 트레이닝 등 다수 코드 지원

### 2-3. 사업주훈련 훈련과정

| API | URL | 응답 루트 |
| --- | --- | --- |
| 목록 | `hr/callOpenApiSvcInfo311L01.do` | `HRDNet` |
| 과정/기관정보 | `hr/callOpenApiSvcInfo311D01.do` | `HRDNet` |
| 훈련일정 | `hr/callOpenApiSvcInfo311D02.do` | `HRDNet` |

특이 필터:

- `crseTracseSe`: `C0041T`, `C0041B`, `C0041N`, `C0041A`

주의:

- 원문 예시 하나가 `http://`로 적혀 있지만, 구현 시 `https://` 기준으로 맞추는 편이 안전합니다.

### 2-4. 국가인적자원개발 컨소시엄 훈련과정

| API | URL | 응답 루트 |
| --- | --- | --- |
| 목록 | `hr/callOpenApiSvcInfo312L01.do` | `HRDNet` |
| 과정/기관정보 | `hr/callOpenApiSvcInfo312D01.do` | `HRDNet` |
| 훈련일정 | `hr/callOpenApiSvcInfo312D02.do` | `HRDNet` |

### 2-5. 일학습병행 훈련과정

| API | URL | 응답 루트 |
| --- | --- | --- |
| 목록 | `hr/callOpenApiSvcInfo313L01.do` | `HRDNet` |
| 과정/기관정보 | `hr/callOpenApiSvcInfo313D01.do` | `HRDNet` |
| 훈련일정 | `hr/callOpenApiSvcInfo313D02.do` | `HRDNet` |

특이 필터:

- `crseTracseSe`: 단독기업형, 아우스빌둥, 공동훈련센터형, 도제학교, IPP, Uni-tech, P-TECH 등

## 3. 구직자 취업역량 강화프로그램

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo217L01.do` | 프로그램 일정 조회 | `startPage`, `display`, `pgmStdt`, `topOrgCd`, `orgCd` | `empPgmSchdInviteList` |

핵심 필드:

- `orgNm`, `pgmNm`, `pgmSubNm`, `pgmTarget`
- `pgmStdt`, `pgmEndt`
- `openTimeClcd`, `openTime`, `operationTime`, `openPlcCont`

비고:

- 원문상 별도 상세 API는 없습니다.
- `pgmStdt`를 생략하면 "오늘" 기준 조회로 동작합니다.

## 4. 강소기업

### 4-1. 강소기업 목록

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo216L01.do` | 강소기업 조회 | `startPage`, `display`, `region` | `smallGiantsList` |

핵심 필드:

- `coNm`, `busiNo`, `reperNm`
- `superIndTpCd`, `indTpCd`
- `regionCd`, `regionNm`
- `coHomePage`, `alwaysWorkerCnt`
- `smlgntCoClcd`, `sgBrandNm`

### 4-2. 강소기업현장탐방기

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo216L11.do` | 탐방기 조회 | `callTp=L`, `startPage`, `display`, `regionCd`, `indTypeCd`, `compNm` | `compSpotInqList` |

핵심 필드:

- `busiNo`, `compNm`, `regionNm`, `indTypeNm`, `smlgntCoClcd`, `collectDtm`

비고:

- 원문에는 "목록/상세" 문구가 같이 적혀 있지만 실제 스크랩에는 목록 엔드포인트만 정리되어 있습니다.

### 4-3. 청년강소기업체험

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo216L21.do` | 청년 체험형 연수 조회 | `callTp=L`, `startPage`, `display`, `sregDtmValCd`, `region`, `occupation`, `traSchStdt`, `traSchEndt`, `custNm`, `orgNm` | `traOrgList` |

핵심 필드:

- `wantedAuthNo`
- `traOrgNm`, `traCustNm`
- `collectJobsNm`, `regionNm`
- `selPsncnt`, `collectPsncnt`
- `traStdt`, `traEndt`, `regDt`

등록일 기간코드 `sregDtmValCd`:

- `1` 오늘
- `2` 3일
- `3` 1주 이내
- `4` 2주 이내
- `5` 한달
- `6` 전체

### 4-4. 청년친화강소기업

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo216L31.do` | 청년친화 강소기업 조회 | `startPage`, `display` | `smallGiantsList` |

핵심 필드:

- `coNm`, `busiNo`, `reperNm`
- `superIndTpCd`, `indTpCd`
- `regionCd`, `regionNm`
- `alwaysWorkerCnt`

## 5. 학과정보

### 5-1. 학과 목록

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo213L01.do` | 학과 검색 | `target=MAJORCD`, `srchType`, `keyword` | `majorsList` |

검색 타입:

- `A` 전체
- `K` 키워드

목록 핵심 필드:

- `majorGb`: `1` 일반학과, `2` 이색학과
- `empCurtState1Id`: 계열 ID
- `empCurtState2Id`: 학과 ID
- `knowSchDptNm`, `knowDtlSchDptNm`

### 5-2. 일반학과 상세

| API | URL | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- |
| 상세 | `wk/callOpenApiSvcInfo213D01.do` | `target=MAJORDTL`, `majorGb=1`, `empCurtState1Id`, `empCurtState2Id` | `majorSum` |

핵심 블록:

- 소개: `schDptIntroSum`, `aptdIntrstCont`
- 관련학과: `relSchDptList`
- 주요교과목: `mainSubjectList`
- 자격: `licList`
- 개설대학: `schDptList`
- 관련직업: `relAdvanJobsList`
- 모집현황: `recrStateList`

### 5-3. 이색학과 상세

| API | URL | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- |
| 상세 | `wk/callOpenApiSvcInfo213D02.do` | `target=MAJORDTL`, `majorGb=2`, `empCurtState1Id`, `empCurtState2Id` | `specMajor` |

핵심 필드:

- `schDptIntroSum`, `whatStudy`, `howPrepare`, `jobPropect`

## 6. 직업정보

### 6-1. 직업 목록

| API | URL | 용도 | 주요 요청값 | 응답 루트 |
| --- | --- | --- | --- | --- |
| 목록 | `wk/callOpenApiSvcInfo212L01.do` | 직업 검색 | `target=JOBCD`, `srchType`, `keyword`, `avgSal`, `prospect` | `jobsList` |

검색 타입:

- `K` 키워드
- `C` 조건

조건 검색 코드:

- `avgSal`: `10` 3천 미만, `20` 3천~4천, `30` 4천~5천, `40` 5천 이상
- `prospect`: `1` 증가, `2` 다소 증가, `3` 유지, `4` 다소 감소, `5` 감소

목록 핵심 필드:

- `jobCd`: 상세 조회 키
- `jobNm`, `jobClcd`, `jobClcdNM`

### 6-2. 직업 상세 묶음

직업 상세는 공통으로 아래 요청값을 씁니다.

- `target=JOBDTL`
- `jobGb=1`
- `jobCd`
- `dtlGb`

| 상세 종류 | URL | `dtlGb` | 응답 루트 | 핵심 내용 |
| --- | --- | --- | --- | --- |
| 요약 | `wk/callOpenApiSvcInfo212D01.do` | `1` | `jobSum` | 개요, 되는 길, 관련전공/자격, 임금, 만족도, 전망, 관련직업 |
| 하는 일 | `wk/callOpenApiSvcInfo212D02.do` | `2` | `jobsDo` | 직무개요, 수행직무, 관련직업 |
| 교육/자격/훈련 | `wk/callOpenApiSvcInfo212D03.do` | `3` | `way` | 기술/지식, 학력분포, 전공분포, 관련기관/자격/KECO |
| 임금/만족도/전망 | `wk/callOpenApiSvcInfo212D04.do` | `4` | `salProspect` | 임금, 만족도, 전망률, 조사년도, 일자리현황 |
| 능력/지식/환경 | `wk/callOpenApiSvcInfo212D05.do` | `5` | `ablKnwEnv` | 직업 내/직업 간 비교 지표 |
| 성격/흥미/가치관 | `wk/callOpenApiSvcInfo212D06.do` | `6` | `chrIntrVals` | 성격/흥미/가치관 비교 지표 |
| 업무활동 | `wk/callOpenApiSvcInfo212D07.do` | `7` | `jobActv` | 업무활동 중요도/수준 비교 지표 |

구현 팁:

- 한 화면에 직업 상세를 보여줄 때는 `D01`만으로 충분하지 않고, 보통 `D02`~`D07`을 병렬 호출해야 합니다.
- `D05`~`D07`은 "직업 내 비교"와 "직업 간 비교" 블록이 반복되므로, 범용 점수 테이블 구조로 모델링하는 편이 좋습니다.

## 7. 식별자 체인 요약

### 채용

- 채용행사 목록 -> `areaCd`, `eventNo` -> 채용행사 상세
- 공채속보 목록 -> `empSeqno` -> 공채속보 상세
- 공채기업 목록 -> `empCoNo` -> 공채기업 상세

### 훈련

- 훈련 목록 -> `trprId`, `trprDegr`, `trainstCstId` -> 과정/기관정보, 훈련일정

### 학과

- 학과 목록 -> `majorGb`, `empCurtState1Id`, `empCurtState2Id` -> 일반/이색 상세 분기

### 직업

- 직업 목록 -> `jobCd` -> 7종 직업 상세 호출

## 8. 추천 구현 방식

### XML 매핑

- 응답 루트 기준으로 DTO를 나눕니다.
- 목록형 API는 `meta + items[]`로 통일합니다.
- 동일 계열 훈련 API는 재사용 가능한 파서로 묶습니다.

### 어댑터 계층

- 외부 스키마 그대로 쓰지 말고 서비스 내부 모델로 한 번 정규화합니다.
- 특히 훈련/직업 상세는 필드명이 들쭉날쭉하므로 "도메인 모델"과 "원본 매핑"을 분리하는 편이 낫습니다.

### 원문 참조가 필요한 경우

아래 경우에는 반드시 raw 문서를 같이 확인합니다.

- 코드표 전체가 필요할 때
- 세부 XML 필드를 전부 매핑할 때
- 원문 설명의 예외조건을 검증할 때
- 목록/상세 혼재 문구 때문에 실제 파라미터 의미를 재확인할 때

## 9. 바로 쓰는 호출 예시

### 공채속보 목록

```text
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do?authKey=YOUR_KEY&callTp=L&returnType=XML&startPage=1&display=10
```

### 공채속보 상세

```text
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D21.do?authKey=YOUR_KEY&returnType=XML&callTp=D&empSeqno=EMP_SEQNO
```

### 국민내일배움카드 목록

```text
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do?authKey=YOUR_KEY&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20260101&srchTraEndDt=20261231&sort=ASC&sortCol=2
```

### 직업 목록

```text
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do?authKey=YOUR_KEY&returnType=XML&target=JOBCD&srchType=K&keyword=데이터
```

### 직업 상세 요약

```text
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D01.do?authKey=YOUR_KEY&returnType=XML&target=JOBDTL&jobGb=1&jobCd=JOB_CODE&dtlGb=1
```
