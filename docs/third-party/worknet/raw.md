# [고용24 OPEN-API GUIDE](https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do?bbsClCd=OosccI71O3P2dBxVz5A40Q%3D%3D)
1. EMPLOYMENT_INFO            # 채용정보
채용정보 API - 채용행사
안내

채용행사 API를 활용해서 고용노동부/고용센터의 다양한 채용행사를 구성할 수 있습니다.

채용행사목록
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L11.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L11.do?authKey=[인증키]&returnType=XML&callTp=L&startPage=1&display=1 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	xml 를 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
srchBgnDt	String	조회종료일자 입력값이 있을 때 필수입력	조회시작일자 기간검색을 합니다.
- 조회시작일자 이후에 포함되는 모집공고 등록일을
기준으로 기간검색을 합니다.
srchEndDt	String	조회시작일자 입력값이 있을 때 필수입력	조회종료일자 기간검색을 합니다.
- 조회시작일자 이전에 포함되는 모집공고 등록일을
기준으로 기간검색을 합니다.
keyword	String		직업명 키워드 검색시 입력합니다.(예: 컨설턴트 , 환경)
UTF-8 인코딩입니다.
areaCd	String		지역을 선택합니다.

- 51 : 서울, 강원
- 52 : 부산, 경남
- 53 : 대구, 경북
- 54 : 경기, 인천
- 55 : 광주, 전라, 제주
- 56 : 대전, 충청
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<empEventList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<empEvent>			
<areaCd>	String	지역코드	</areaCd>
<area>	String	지역	</area>
<eventNo>	String	채용행사번호	</eventNo>
<eventNm>	String	행사명	</eventNm>
<eventTerm>	String	행사기간	</eventTerm>
<startDt>	String	시작일	</startDt>
</empEvent>			
</empEventList>	

채용정보 API - 채용행사
안내

채용행사 API를 활용해서 고용노동부/고용센터의 다양한 채용행사를 구성할 수 있습니다.

채용행사상세
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D11.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D11.do?authKey=[인증키]&returnType=XML&callTp=D&areaCd=[지역코드]&eventNo=[채용행사번호] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	xml 를 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
areaCd	String	Y	지역을 선택합니다.

- 51 : 서울, 강원
- 52 : 부산, 경남
- 53 : 대구, 경북
- 54 : 경기, 인천
- 55 : 광주, 전라, 제주
- 56 : 대전, 충청
eventNo	String	Y	채용행사번호를 입력합니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<empEventDtl>			
<eventNm>	String	행사명	</eventNm>
<eventTerm>	String	행사기간	</eventTerm>
<eventPlc>	String	행사장소	</eventPlc>
<joinCoWantedInfo>	String	참여기업구인정보	</joinCoWantedInfo>
<subMatter>	String	부대사항	</subMatter>
<inqTelNo>	String	문의전화	</inqTelNo>
<fax>	String	팩스	</fax>
<charger>	String	담당자	</charger>
<email>	String	이메일	</email>
<visitPath>	String	오시는길	</visitPath>
</empEventDtl>		

채용정보 API - 공채속보
안내

공채속보 API를 이용하여 빠르게 공채속보를 확인 할 수 있습니다.

공채속보목록
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10 
복사
예제2) 다중검색(다중검색 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10&empWantedEduCd=[학력코드1|학력코드2] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
returnType	String	Y	xml 를 반드시 지정합니다.
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
empCoNo	String	 	채용기업번호
coClcd	String	 	(다중검색 가능)
기업 구분코드를 입력합니다.

- 10 : 대기업
- 20 : 공기업
- 30 : 공공기관
- 40 : 중견기업
- 50 : 외국계기업
empWantedTypeCd	String	 	(다중검색 가능)
고용형태를 입력합니다.

- 10 : 정규직
- 20 : 정규직전환
- 30 : 비정규직
- 40 : 기간제
- 50 : 시간선택제
- 60 기타
empWantedCareerCd	String	 	(다중검색 가능)
경력구분을 입력합니다.

- 10 : 경력무관
- 20 : 경력
- 30 : 신입
- 40 : 인턴
jobsCd	String	 	직종코드
empWantedTitle	String	 	채용제목
empWantedEduCd	String	 	(다중검색 가능)
학력을 입력합니다.

- 10 : 고졸
- 20 : 대졸(2~3)
- 30 : 대졸
- 40 : 석사
- 50 : 박사
- 99 : 학력무관
sortField	String	 	
등록일 기준 정렬필드

- regDt : 등록일
- coNm : 회사명
* 해당 검색조건 미입력 시 자동으로 등록일 상향정렬

sortOrderBy	String	 	
등록일 기준 정렬방식

- desc : 상향정렬(defalut)
- asc : 하향정렬
* 해당 검색조건 미입력 시 자동으로 등록일 상향정렬

busino	String	 	사업자번호
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<dhsOpenEmpInfoList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<dhsOpenEmpInfo>			
<empSeqno>	String	공개채용공고순번	</empSeqno>
<empWantedTitle>	String	채용제목	</empWantedTitle>
<empBusiNm>	String	채용업체명	</empBusiNm>
<coClcdNm>	String	기업구분명	</coClcdNm>
<empWantedStdt>	String	채용시작일자	</empWantedStdt>
<empWantedEndt>	String	채용종료일자	</empWantedEndt>
<empWantedTypeNm>	String	고용형태	</empWantedTypeNm>
<regLogImgNm>	String	채용기업로고	</regLogImgNm>
<empWantedHomepgDetail>	String	채용사이트URL	</empWantedHomepgDetail>
<empWantedMobileUrl>	String	모바일채용사이트URL	</empWantedMobileUrl>
</dhsOpenEmpInfo>			
</dhsOpenEmpInfoList>

채용정보 API - 공채속보
안내

공채속보 API를 이용하여 빠르게 공채속보를 확인 할 수 있습니다.

공채속보상세
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D21.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D21.do?authKey=[인증키]&returnType=XML&callTp=D&empSeqno=[공개채용공고순번] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	xml 를 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
empSeqno	String	 	공개채용공고순번
empSelfintroOfferYn	String	 	공개채용자기소개서질의문 제공여부 입니다.(Y: 제공, N:미제공 ) 미입력시 기본 Y
empSelsOfferYn	String	 	공개채용전형단계 제공여부 입니다.(Y: 제공, N:미제공 ) 미입력시 기본 Y
empRecrOfferYn	String	 	공개채용모집공고 제공여부 입니다.(Y: 제공, N:미제공 ) 미입력시 기본 Y
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<dhsOpenEmpInfoDetailRoot>			
<empSeqno>	String	채용기업번호	</empSeqno>
<empWantedTitle>	String	채용제목	</empWantedTitle>
<empBusiNm>	String	채용업체명	</empBusiNm>
<coClcdNm>	String	기업구분명	</coClcdNm>
<empWantedStdt>	String	채용시작일자	</empWantedStdt>
<empWantedEndt>	String	채용종료일자	</empWantedEndt>
<empWantedTypeNm>	String	고용형태	</empWantedTypeNm>>
<empSubmitDocCont>	String	제출서류	</empSubmitDocCont>
<empRcptMthdCont>	String	접수방법	</empRcptMthdCont>
<empAcptPsnAnncCont>	String	합격자발표일	</empAcptPsnAnncCont>
<inqryCont>	String	문의사항	</inqryCont>
<empnEtcCont>	String	기타사항	</empnEtcCont>
<regFileList>			
<regFileListInfo>			
<regFileNm>	String	채용첨부파일	</regFileNm>
</regFileListInfo>			
</regFileList>			
<regLogImgNm>	String	채용기업로고	</regLogImgNm>
<empWantedHomepg>	String	채용기업홈페이지	</empWantedHomepg>
<empWantedHomepgDetail>	String	채용사이트URL	</empWantedHomepgDetail>
<empWantedMobileUrl>	String	모바일채용사이트URL	</empWantedMobileUrl>
<empJobsList>			
<empJobsListInfo>			
<jobsCd>	String	직종코드	</jobsCd>
<jobsCdKorNm>	String	직종명	</jobsCdKorNm>
</empJobsListInfo>			
</empJobsList>			
<empSelsList>			
<empSelsListInfo>			
<selfintroQstCont>	String	자기소개서질문내용	</selfintroQstCont>
</empSelsListInfo>			
</empSelsList>			
<empSelsList>			
<empSelsListInfo>			
<selsNm>	String	전형단계명	</selsNm>
<selsSchdCont>	String	전형단계일정내용	</selsSchdCont>
<selsCont>	String	전형단계내용	</selsCont>
<selsMemoCont>	String	전형단계비고	</selsMemoCont>
</empSelsListInfo>			
</empSelsList>			
<empnRecrSummaryCont>	String	모집부분 천체요약	</empnRecrSummaryCont>
<empRecrList>			
<empRecrListInfo>			
<empRecrNm>	String	채용모집명	</empRecrNm>
<jobCont>	String	직무설명	</jobCont>
<selsCont>	String	전형단계내용	</selsCont>
<workRegionNm>	String	근무지	</workRegionNm>
<empWantedCareerNm>	String	지원자격(경력)	</empWantedCareerNm>
<empWantedEduNm>	String	지원자격(학력)	</empWantedEduNm>
<sptCertEtc>	String	지원자격(기타)	</sptCertEtc>
<recrPsncnt>	String	모집인원수	</recrPsncnt>
<empRecrMemoCont>	String	비고	</empRecrMemoCont>
</empRecrListInfo>			
</empRecrList>			
<recrCommCont>	String	공통사항	</recrCommCont>
</dhsOpenEmpInfoDetailRoot>	

채용정보 API - 공채기업정보
안내

공채기업정보 API를 이용하여 보다 정확한 공채기업정보를 확인 할 수 있습니다.

공채기업목록
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L31.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L31.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10 
복사
예제2) 다중검색(다중검색 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L31.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10&coClcd=[기업구분코드1|기업구분코드2] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
returnType	String	Y	xml 를 반드시 지정합니다.
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
coClcd	String	 	(다중검색 가능)
기업 구분코드를 입력합니다.

- 10 : 대기업
- 20 : 공기업
- 30 : 공공기관
- 40 : 중견기업
- 50 : 외국계기업
sortField	String	 	
등록일 기준 정렬필드

- regDt : 등록일
- coNm : 회사명
* 해당 검색조건 미입력 시 자동으로 등록일 상향정렬

sortOrderBy	String	 	
등록일 기준 정렬방식

- desc : 상향정렬(defalut)
- asc : 하향정렬
* 해당 검색조건 미입력 시 자동으로 등록일 상향정렬

coNm	String	 	회사명을 검색합니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<dhsOpenEmpHireInfoList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<dhsOpenEmpHireInfo>			
<empCoNo>	String	채용기업번호	</empCoNo>
<coClcdNm>	String	회사명	</coClcdNm>
<coClcdNm>	String	기업구분명	</coClcdNm>
<busino>	String	사업자등록번호	</busino>
<mapCoorY>	String	좌표:위도	</mapCoorY>
<mapCoorX>	String	좌표:경도	</mapCoorX>
<regLogImgNm>	String	채용기업로고	</regLogImgNm>
<coIntroSummaryCont>	String	기업소개요약	</coIntroSummaryCont>
<coIntroCont>	String	기업소개상세	</coIntroCont>
<homepg>	String	홈페이지	</homepg>
<mainBusiCont>	String	주요사업	</mainBusiCont>
</dhsOpenEmpHireInfo>			
</dhsOpenEmpHireInfoList>

채용정보 API - 공채기업정보
안내

공채기업정보 API를 이용하여 보다 정확한 공채기업정보를 확인 할 수 있습니다.

공채기업상세
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D31.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D31.do?authKey=[인증키]&returnType=XML&callTp=D&empCoNo=[채용기업번호] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	xml 를 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
empCoNo	String	Y	채용기업번호
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<dhsOpenEmpHireInfoDetailRoot>			
<empCoNo>	String	채용기업번호	</empCoNo>
<coNm>	String	회사명	</coNm>
<coClcdNm>	String	기업구분명	</coClcdNm>
<regLogImgNm>	String	로고	</regLogImgNm>
<homepg>	String	홈페이지	</homepg>
<busino>	String	사업자등록번호	</busino>
<mapCoorY>	String	좌표:위도	</mapCoorY>
<mapCoorX>	String	좌표:경도	</mapCoorX>
<mainBusiCont>	String	주요사업	</mainBusiCont>
<coIntroSummaryCont>	String	기업소개 요약	</coIntroSummaryCont>
<coIntroCont>	String	기업소개 상세	</coIntroCont>
<welfareList>			
<welfareListInfo>			
<cdKorNm>	String	카테고리	</cdKorNm>
<welfareCont>	String	복리후생내용	</welfareCont>
</welfareListInfo>			
</welfareList>			
<historyList>			
<historyListInfo>			
<histYr>	String	연혁년도	</histYr>
<histMm>	String	연혁월	</histMm>
<histCont>	String	연혁내용	</histCont>
</historyListInfo>			
</historyList>			
<rightPeopleList>			
<rightPeopleListInfo>			
<psnrightKeywordNm>	String	인재상키워드	</psnrightKeywordNm>
<psnrightDesc>	String	인재상내용	</psnrightDesc>
</rightPeopleListInfo>			
</rightPeopleList>			
</dhsOpenEmpHireInfoDetailRoot>	


2. NATIONAL_TRAINING          # 국민내일배움카드 훈련과정
국민내일배움카드 훈련과정 API - 목록
안내

국민내일배움카드 훈련과정을 위한 직업능력개발 훈련과정 API를 이용할 수 있습니다.
훈련생 출결정보는 훈련기관만 이용하며, HRD-Net에서 별도 회원가입후 신청가능합니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&sort=ASC&sortCol=2 
복사
예제2) 선택조건을 추가하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&srchTraArea1=[훈련지역 대분류]&sort=ASC&sortCol=2 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)
pageNum	string	필수	시작페이지. 기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다. 최대 1000 까지 가능.
pageSize	string	필수	페이지당 출력건수, 기본값 10, 최대 100까지 가능.
wkendSe	string	선택	주말/주중 구분	주말 : 1
주말 주중 혼합 : 2
주중 : 3
해당없음 : 9
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraArea1	string	선택	훈련지역 대분류	'11' : 서울, '26' : 부산, '27' : 대구, '28' : 인천 '29' : 광주, '30' : 대전, '31' : 울산, '36' : 세종, '41' : 경기, '43' : 충북, '44' : 충남, '45' : 전북, '46' : 전남, '47' : 경북, '48' : 경남, '50' : 제주, '51' : 강원
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraArea2	string	선택	훈련지역 중분류
훈련지역 대분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
srchNcs1	string	선택	NCS 직종 1차분류 코드	'01' : 사업관리
'02' : 경영/회계/사무
'03' : 금융/보험
'04' : 교육/자연/사회과학
'05' : 법률/경찰/소방/교도/국방
'06' : 보건/의료
'07' : 사회복지/종교
'08' : 문화/예술/디자인/방송
'09' : 운전/운송
'10' : 영업판매
'11' : 경비/청소
'12' : 이용/숙박/여행/오락/스포츠	'13' : 음식서비스
'14' : 건설
'15' : 기계
'16' : 재료
'17' : 화학/바이오
'18' : 섬유/의복
'19' : 전기/전자
'20' : 정보통신
'21' : 식품가공
'22' : 인쇄/목재/가구/공예
'23' : 환경/에너지/안전
'24' : 농림어업
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs2	string	선택	NCS 직종 2차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs3	string	선택	NCS 직종 3차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs4	string	선택	NCS 직종 4차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
crseTracseSe	string	선택	훈련유형	'C0061' : 국민내일배움카드(일반)
'C0061S' : 국민내일배움카드(주 훈련대상 : 구직자)
'C0061I' : 국민내일배움카드(주 훈련대상 : 재직자)
'C0054' : 국가기간전략산업직종
'C0055C' : 과정평가형훈련
'C0054G' : 기업맞춤형훈련
'C0054Y' : 스마트혼합훈련
'C0054S' : 일반고특화훈련
'C0104' : K-디지털 트레이닝
'C0105' : K-디지털 기초역량훈련
'C0102' : 산업구조변화대응
'C0055' : 실업자 원격훈련
'C0031' : 근로자 원격훈련
'C0031C' : 돌봄서비스훈련
'C0031F' : 근로자 외국어훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraGbn	string	선택	훈련구분코드	'M1001' : 일반과정
'M1005' : 인터넷과정
'M1010' : 혼합과정(BL)
'M1014' : 스마트혼합훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraType	string	선택	훈련종류(훈련구분에 따라 세부내용이 변경됨)	'* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
* 인터넷과정과 혼합과정의 경우 세부항목이 없음
srchTraStDt	string	필수	훈련시작일 From	
srchTraEndDt	string	필수	훈련시작일 To	
srchTraProcessNm	string	선택	훈련과정명	
srchTraOrganNm	string	선택	훈련기관명	
sort	string	필수	정렬방법	"ASC",
"DESC"
sortCol	string	필수	정렬컬럼	훈련기관명 : 1
훈련시작일 : 2
훈련기관 직종별 취업률 : 3
만족도점수 : 5
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_cnt>	string	검색된 총 건수	</scn_cnt>
<pageNum>	string	현재페이지	</pageNum>
<pageSize>	string	페이지당 출력개수, 페이지당 표현될 자료의 개수	</pageSize>
<srchList>	string		
<scn_list>			
ADDRESS	string	주소	<address></address>
CERTIFICATE	string	자격증	<certificate></certificate>
CONTENTS	string	컨텐츠	<contents></contents>
COURSE_MAN	string	수강비	<courseMan></courseMan>
EI_EMPL_CNT3	string	고용보험3개월 취업인원 수	<eiEmplCnt3></eiEmplCnt3>
EI_EMPL_CNT3_GT10	string	고용보험3개월 취업누적인원 10인이하 여부 (Y/N)
17.11.07부터 제공되지 않는 항목이나 기존 API 사용자를 위해 Null값을 제공	<eiEmplCnt3Gt10></eiEmplCnt3Gt10>
EI_EMPL_RATE3	string	고용보험3개월 취업률	<eiEmplRate3></eiEmplRate3>
EI_EMPL_RATE6	string	고용보험6개월 취업률	<eiEmplRate6></eiEmplRate6>
GRADE	string	등급	<grade></grade>
INST_CD	string	훈련기관 코드	<instCd></instCd>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
REAL_MAN	string	실제 훈련비	<realMan></realMan>
REG_COURSE_MAN	string	수강신청 인원	<regCourseMan></regCourseMan>
STDG_SCOR	string	만족도 점수	<stdgScor></stdgScor>
SUB_TITLE	string	부 제목	<subTitle></subTitle>
SUB_TITLE_LINK	string	부 제목 링크	<subTitleLink></subTitleLink>
TEL_NO	string	전화번호	<telNo></telNo>
TITLE	string	제목	<title></title>
TITLE_ICON	string	제목 아이콘	<titleIcon></titleIcon>
TITLE_LINK	string	제목 링크	<titleLink></titleLink>
TRA_END_DATE	string	훈련종료일자	<traEndDate></traEndDate>
TRA_START_DATE	string	훈련시작일자	<traStartDate></traStartDate>
TRAIN_TARGET	string	훈련대상	<trainTarget></trainTarget>
TRAIN_TARGET_CD	string	훈련구분	<trainTargetCd></trainTargetCd>
TRAINST_CST_ID	string	훈련기관ID	<trainstCstId></trainstCstId>
TRNG_AREA_CD	string	지역코드(중분류)	<trngAreaCd></trngAreaCd>
TRPR_DEGR	string	훈련과정 순차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
WKED_SE	string	주말/주중 구분	<wkendSe></wkendSe>
YARD_MAN	string	정원	<yardMan></yardMan>
</scn_list>			
</srchList>			
</HRDNet>

국민내일배움카드 훈련과정 API - 과정/기관정보
안내

국민내일배움카드 훈련과정을 위한 직업능력개발 훈련과정 API를 이용할 수 있습니다.
훈련생 출결정보는 훈련기관만 이용하며, HRD-Net에서 별도 회원가입후 신청가능합니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L02.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L02.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	필수	훈련과정 회차
srchTorgId	string	필수	훈련기관 ID
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<inst_base_info>		훈련기관 기초정보	
ADDR1	string	주소지	<addr1></addr>
ADDR2	string	상세주소	<addr2></addr2>
FILE_PATH	string	파일경로	<filePath></filePath>
HP_ADDR	string	홈페이지 주소	<hpAddr></hpAddr>
INO_NM	string	훈련기관명	<inoNm></inoNm>
INST_INO	string	훈련기관 코드	<instIno></instIno>
INST_PER_TRCO	string	실제 훈련비	<instPerTrco></instPerTrco>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
NCS_NM	string	NCS 명	<ncsNm></ncsNm>
NCS_YN	string	NCS 여부	<ncsYn></ncsYn>
NON_NCS_COURSE_PRCTTQ_TIME	string	비 NCS교과 실기시간	<nonNcsCoursePrcttqTime></nonNcsCoursePrcttqTime>
NON_NCS_COURSE_THEORY_TIME	string	비 NCS교과 이론시간	<nonNcsCourseTheoryTime></nonNcsCourseTheoryTime>
P_FILE_NAME	string	로고 파일명	<pFileName></pFileName>
PER_TRCO	string	정부지원금	<perTrco></perTrco>
TORG_PAR_GRAD	string	평가등급	<torgParGrad></torgParGrad>
TR_DCNT	string	총 훈련일수	<trDcnt></trDcnt>
TRAING_MTH_CD	string	훈련방법코드	<traingMthCd></traingMthCd>
TRPR_CHAP	string	담당자명	<trprChap></trprChap>
TRPR_CHAP_EMAIL	string	담당자 이메일	<trprChapEmail></trprChapEmail>
TRPR_CHAP_TEL	string	담당자 전화번호	<trprChapTel></trprChapTel>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_GBN	string	훈련과정 구분	<trprGbn></trprGbn>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
TRPR_TARGET	string	주요 훈련과정 구분	<trprTarget></trprTarget>
TRPR_TARGET_NM	string	주요 훈련과정 구분명	<trprTargetNm></trprTargetNm>
TRPR_UP_YN	string	국가기간전략산업직종훈련 여부	<trprUpYn></trprUpYn>
TRTM	string	총 훈련시간	<trtm></trtm>
ZIP_CD	string	우편번호	<zipCd></zipCd>
</inst_base_info>		훈련기관 기초정보	
<inst_detail_info>		훈련기관 상세정보	
GOV_BUSI_NM	string	훈련분야명	<govBusiNm></govBusiNm>
TORG_GBN_CD	string	훈련종류	<torgGbnCd></torgGbnCd>
TOT_TRAING_DYCT	string	훈련일수	<totTraingDyct></totTraingDyct>
TOT_TRAING_TIME	string	훈련시간	<totTraingTime></totTraingTime>
TGCR_GNRL_TRNE_OWEP_ALLT	string	본인부담액	<tgcrGnrlTrneOwepAllt></tgcrGnrlTrneOwepAllt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정코드	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</inst_detail_info>		훈련기관 상세정보	
<inst_facility_info>		시설 상세 정보	
<inst_facility_info_list>	시설 정보 리스트	
CHANGE_CSTMR_ID	string	변동훈련기관ID	<changeCstmrId></changeCstmrId>
CSTMR_ID	string	훈련기관ID	<cstmrId></cstmrId>
CSTRMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
FCLTY_AR_CN	string	시설 면적(㎡)	<fcltyArCn></fcltyArCn>
HOLD_QY	string	시설 수	<holdQy></holdQy>
OCU_ACPTN_CN	string	인원 수(명)	<ocuAcptnNmprCn></ocuAcptnNmprCn>
TRAFCLTY_NM	string	시설명	<trafcltyNm></trafcltyNm>
</inst_facility_info_list>	시설 정보 리스트	
</inst_facility_info>		시설 상세정보	
<inst_eqnm_info>		장비 상세 정보	
<inst_eqnm_info_list>	장비 정보 리스트	
CSTMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
EQPMN_NM	string	장비명	<eqpmnNm></eqpmnNm>
HOLD_QY	string	보유 수량	<holdQy></holdQy>
</inst_eqnm_info_list>	장비 정보 리스트	
</inst_eqnm_info>		장비 상세 정보	
</HRDNet>

국민내일배움카드 훈련과정 API - 훈련일정
안내

국민내일배움카드 훈련과정을 위한 직업능력개발 훈련과정 API를 이용할 수 있습니다.
훈련생 출결정보는 훈련기관만 이용하며, HRD-Net에서 별도 회원가입후 신청가능합니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L03.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L03.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	선택	훈련과정 회차(입력하지 않으면 모든 회차가 조회됩니다.)
srchTorgId	string	필수	훈련기관 ID
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_list>	string		
EI_EMPL_RATE_3	string	3개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate3></eiEmplRate3>
EI_EMPL_CNT_3	string	3개월 고용보험 취업인원	<eiEmplCnt3></eiEmplCnt3>
EI_EMPL_RATE_6	string	6개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate6></eiEmplRate6>
EI_EMPL_CNT_6	string	6개월 고용보험 취업인원	<eiEmplCnt6></eiEmplCnt6>
HRD_EMPL_RATE_6	string	6개월 고용보험 미가입 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<hrdEmplRate6></hrdEmplRate6>
HRD_EMPL_CNT_6	string	6개월 고용보험 미가입 취업인원	<hrdEmplCnt6></hrdEmplCnt6>
INST_INO	string	훈련기관 코드	<instIno></instIno>
TOT_FXNUM	string	모집인원(정원)	<totFxnum></totFxnum>
TOT_PAR_MKS	string	수강인원	<totParMks></totParMks>
FINI_CNT	string	수료인원	<finiCnt></finiCnt>
TOT_TRCO	string	총 훈련비	<totTrco></totTrco>
TOT_TRP_CNT	string	수강(신청)인원	<totTrpCnt></totTrpCnt>
TR_END_DT	string	훈련종료일	<trEndDt></trEndDt>
TR_STA_DT	string	훈련 시작일	<trStaDt></trStaDt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</scn_list>	string		
</HRDNet>

3. BUSINESS_TRAINING          # 사업주훈련 훈련과정
사업주훈련 훈련과정 API - 목록
안내

사업주훈련을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311L01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&sort=ASC&sortCol=2 
복사
예제2) 선택조건을 추가하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&srchTraArea1=[훈련지역 대분류]&sort=ASC&sortCol=2 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)
pageNum	string	필수	시작페이지. 기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다. 최대 1000 까지 가능.
pageSize	string	필수	페이지당 출력건수, 기본값 10, 최대 100까지 가능.
srchTraArea1	string	선택	훈련지역 대분류	'11' : 서울, '26' : 부산, '27' : 대구, '28' : 인천 '29' : 광주, '30' : 대전, '31' : 울산, '36' : 세종, '41' : 경기, '43' : 충북, '44' : 충남, '45' : 전북, '46' : 전남, '47' : 경북, '48' : 경남, '50' : 제주, '51' : 강원
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraArea2	string	선택	훈련지역 중분류
훈련지역 대분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
srchNcs1	string	선택	NCS 직종 1차분류 코드	'01' : 사업관리
'02' : 경영/회계/사무
'03' : 금융/보험
'04' : 교육/자연/사회과학
'05' : 법률/경찰/소방/교도/국방
'06' : 보건/의료
'07' : 사회복지/종교
'08' : 문화/예술/디자인/방송
'09' : 운전/운송
'10' : 영업판매
'11' : 경비/청소
'12' : 이용/숙박/여행/오락/스포츠	'13' : 음식서비스
'14' : 건설
'15' : 기계
'16' : 재료
'17' : 화학/바이오
'18' : 섬유/의복
'19' : 전기/전자
'20' : 정보통신
'21' : 식품가공
'22' : 인쇄/목재/가구/공예
'23' : 환경/에너지/안전
'24' : 농림어업
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs2	string	선택	NCS 직종 2차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs3	string	선택	NCS 직종 3차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs4	string	선택	NCS 직종 4차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
crseTracseSe	string	선택	훈련유형	'C0041T' : 일반직무훈련
'C0041B' : 기업직업훈련카드
'C0041N' : 고숙련신기술훈련
'C0041A' : HRD 아카이브
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraGbn	string	선택	훈련구분코드	'M1001' : 일반과정
'M1005' : 인터넷과정
'M1010' : 혼합과정(BL)
'M1011' : 스마트혼합훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraType	string	선택	훈련종류(훈련구분에 따라 세부내용이 변경됨)	'* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
* 인터넷과정과 혼합과정의 경우 세부항목이 없음
srchTraStDt	string	필수	훈련시작일 From	
srchTraEndDt	string	필수	훈련시작일 To	
srchTraProcessNm	string	선택	훈련과정명	
srchTraOrganNm	string	선택	훈련기관명	
sort	string	필수	정렬방법	"ASC",
"DESC"
sortCol	string	필수	정렬컬럼	훈련기관명 : 1
훈련시작일 : 2
훈련기관 직종별 취업률 : 3
만족도점수 : 5
훈련종료일 : 6
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_cnt>	string	검색된 총 건수	</scn_cnt>
<pageNum>	string	현재페이지	</pageNum>
<pageSize>	string	페이지당 출력개수, 페이지당 표현될 자료의 개수	</pageSize>
<srchList>	string		
<scn_list>			
ADDRESS	string	주소	<address></address>
CERTIFICATE	string	자격증	<certificate></certificate>
CONTENTS	string	컨텐츠	<contents></contents>
COURSE_MAN	string	수강비	<courseMan></courseMan>
GRADE	string	등급	<grade></grade>
INST_CD	string	훈련기관 코드	<instCd></instCd>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
REAL_MAN	string	실제 훈련비	<realMan></realMan>
REG_COURSE_MAN	string	수강신청 인원	<regCourseMan></regCourseMan>
SUB_TITLE	string	부 제목	<subTitle></subTitle>
SUB_TITLE_LINK	string	부 제목 링크	<subTitleLink></subTitleLink>
TEL_NO	string	전화번호	<telNo></telNo>
TITLE	string	제목	<title></title>
TITLE_ICON	string	제목 아이콘	<titleIcon></titleIcon>
TITLE_LINK	string	제목 링크	<titleLink></titleLink>
TRA_END_DATE	string	훈련종료일자	<traEndDate></traEndDate>
TRA_START_DATE	string	훈련시작일자	<traStartDate></traStartDate>
TRAIN_TARGET	string	훈련대상	<trainTarget></trainTarget>
TRAIN_TARGET_CD	string	훈련구분	<trainTargetCd></trainTargetCd>
TRAINST_CST_ID	string	훈련기관ID	<trainstCstId></trainstCstId>
TRNG_AREA_CD	string	지역코드(중분류)	<trngAreaCd></trngAreaCd>
TRPR_DEGR	string	훈련과정 순차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
YARD_MAN	string	정원	<yardMan></yardMan>
</scn_list>			
</srchList>			
</HRDNet>		

사업주훈련 훈련과정 API - 과정/기관정보
안내

사업주훈련을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311D01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311D01.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	필수	훈련과정 회차
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<inst_base_info>		훈련기관 기초정보	
ADDR1	string	주소지	<addr1></addr1>
ADDR2	string	상세주소	<addr2></addr2>
FILE_PATH	string	파일경로	<filePath></filePath>
HP_ADDR	string	홈페이지 주소	<hpAddr></hpAddr>
INO_NM	string	훈련기관명	<inoNm></inoNm>
INST_INO	string	훈련기관 코드	<instIno></instIno>
INST_PER_TRCO	string	실제 훈련비	<instPerTrco></instPerTrco>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
NCS_NM	string	NCS 명	<ncsNm></ncsNm>
NCS_YN	string	NCS 여부	<ncsYn></ncsYn>
NON_NCS_COURSE_PRCTTQ_TIME	string	비 NCS교과 실기시간	<nonNcsCoursePrcttqTime></nonNcsCoursePrcttqTime>
NON_NCS_COURSE_THEORY_TIME	string	비 NCS교과 이론시간	<nonNcsCourseTheoryTime></nonNcsCourseTheoryTime>
P_FILE_NAME	string	로고 파일명	<pFileName></pFileName>
PER_TRCO	string	정부지원금	<perTrco></perTrco>
TORG_PAR_GRAD	string	평가등급	<torgParGrad></torgParGrad>
TR_DCNT	string	총 훈련일수	<trDcnt></trDcnt>
TR_GBN	string	'HRD'로 일정한 값 조회	<trGbn></trGbn>
TRAING_MTH_CD	string	훈련방법코드	<traingMthCd></traingMthCd>
TRPR_CHAP	string	담당자명	<trprChap></trprChap>
TRPR_CHAP_EMAIL	string	담당자 이메일	<trprChapEmail></trprChapEmail>
TRPR_CHAP_TEL	string	담당자 전화번호	<trprChapTel></trprChapTel>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_GBN	string	훈련과정 구분	<trprGbn></trprGbn>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
TRPR_TARGET	string	주요 훈련과정 구분	<trprTarget></trprTarget>
TRPR_TARGET_NM	string	주요 훈련과정 구분명	<trprTargetNm></trprTargetNm>
TRTM	string	총 훈련시간	<trtm></trtm>
ZIP_CD	string	우편번호	<zipCd></zipCd>
</inst_base_info>		훈련기관 기초정보	
<inst_detail_info>		훈련기관 상세정보	
GOV_BUSI_NM	string	훈련분야명	<govBusiNm></govBusiNm>
TORG_GBN_CD	string	훈련종류	<torgGbnCd></torgGbnCd>
TOT_TRAING_DYCT	string	훈련일수	<totTraingDyct></totTraingDyct>
TOT_TRAING_TIME	string	훈련시간	<totTraingTime></totTraingTime>
TGCR_GNRL_TRNE_OWEP_ALLT	string	본인부담액	<tgcrGnrlTrneOwepAllt></tgcrGnrlTrneOwepAllt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정코드	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</inst_detail_info>		훈련기관 상세정보	
<inst_facility_info>		시설 상세 정보	
<inst_facility_info_list>	시설 정보 리스트	
CHANGE_CSTMR_ID	string	변동훈련기관ID	<changeCstmrId></changeCstmrId>
CSTMR_ID	string	훈련기관ID	<cstmrId></cstmrId>
CSTRMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
FCLTY_AR_CN	string	시설 면적(㎡)	<fcltyArCn></fcltyArCn>
HOLD_QY	string	시설 수	<holdQy></holdQy>
OCU_ACPTN_CN	string	인원 수(명)	<ocuAcptnNmprCn></ocuAcptnNmprCn>
TRAFCLTY_NM	string	시설명	<trafcltyNm></trafcltyNm>
</inst_facility_info_list>	시설 정보 리스트	
</inst_facility_info>		시설 상세정보	
<inst_eqnm_info>		장비 상세 정보	
<inst_eqnm_info_list>	장비 정보 리스트	
CSTMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
EQPMN_NM	string	장비명	<eqpmnNm></eqpmnNm>
HOLD_QY	string	보유 수량	<holdQy></holdQy>
</inst_eqnm_info_list>	장비 정보 리스트	
</inst_eqnm_info>		장비 상세 정보	
</HRDNet>	

사업주훈련 훈련과정 API - 훈련일정
안내

사업주훈련을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311D02.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

http://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311D02.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	선택	훈련과정 회차(입력하지 않으면 모든 회차가 조회됩니다.)
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_list>	string		
EI_EMPL_RATE_3	string	3개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate3></eiEmplRate3>
EI_EMPL_CNT_3	string	3개월 고용보험 취업인원	<eiEmplCnt3></eiEmplCnt3>
EI_EMPL_RATE_6	string	6개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate6></eiEmplRate6>
EI_EMPL_CNT_6	string	6개월 고용보험 취업인원	<eiEmplCnt6></eiEmplCnt6>
HRD_EMPL_RATE_6	string	6개월 고용보험 미가입 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<hrdEmplRate6></hrdEmplRate6>
HRD_EMPL_CNT_6	string	6개월 고용보험 미가입 취업인원	<hrdEmplCnt6></hrdEmplCnt6>
INST_INO	string	훈련기관 코드	<instIno></instIno>
TOT_FXNUM	string	모집인원(정원)	<totFxnum></totFxnum>
TOT_PAR_MKS	string	수강인원	<totParMks></totParMks>
TOT_TRCO	string	총 훈련비	<totTrco></totTrco>
TOT_TRP_CNT	string	수강(신청) 인원	<totTrpCnt></totTrpCnt>
TR_END_DT	string	훈련종료일	<trEndDt></trEndDt>
TR_STA_DT	string	훈련 시작일	<trStaDt></trStaDt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</scn_list>	string		
</HRDNet>	

4. NATIONAL_HUMAN_RESOURCES   # 국가인적자원개발 컨소시엄 훈련과정
국가인적자원개발 컨소시엄 훈련과정 API - 목록
안내

국가인적자원개발 컨소시엄 훔련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312L01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&sort=ASC&sortCol=2 
복사
예제2) 선택조건을 추가하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&srchTraArea1=[훈련지역 대분류]&sort=ASC&sortCol=2 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)
pageNum	string	필수	시작페이지. 기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다. 최대 1000 까지 가능.
pageSize	string	필수	페이지당 출력건수, 기본값 10, 최대 100까지 가능.
srchTraArea1	string	선택	훈련지역 대분류	'11' : 서울, '26' : 부산, '27' : 대구, '28' : 인천 '29' : 광주, '30' : 대전, '31' : 울산, '36' : 세종, '41' : 경기, '43' : 충북, '44' : 충남, '45' : 전북, '46' : 전남, '47' : 경북, '48' : 경남, '50' : 제주, '51' : 강원
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraArea2	string	선택	훈련지역 중분류
훈련지역 대분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
srchNcs1	string	선택	NCS 직종 1차분류 코드	'01' : 사업관리
'02' : 경영/회계/사무
'03' : 금융/보험
'04' : 교육/자연/사회과학
'05' : 법률/경찰/소방/교도/국방
'06' : 보건/의료
'07' : 사회복지/종교
'08' : 문화/예술/디자인/방송
'09' : 운전/운송
'10' : 영업판매
'11' : 경비/청소
'12' : 이용/숙박/여행/오락/스포츠	'13' : 음식서비스
'14' : 건설
'15' : 기계
'16' : 재료
'17' : 화학/바이오
'18' : 섬유/의복
'19' : 전기/전자
'20' : 정보통신
'21' : 식품가공
'22' : 인쇄/목재/가구/공예
'23' : 환경/에너지/안전
'24' : 농림어업
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs2	string	선택	NCS 직종 2차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs3	string	선택	NCS 직종 3차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs4	string	선택	NCS 직종 4차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
crseTracseSe	string	선택	훈련유형	'C0042' : 국가인적자원개발컨소시엄
'C0042C' : 대중소 공동훈련
'C0066' : 지역산업맞춤형 인력양성
'C0098' : 산업계주도 청년맞춤형훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraGbn	string	선택	훈련구분코드	'M1001' : 일반과정
'M1005' : 인터넷과정
'M1010' : 혼합과정(BL)
'M1011' : 스마트혼합훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraType	string	선택	훈련종류(훈련구분에 따라 세부내용이 변경됨)	'* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
* 인터넷과정과 혼합과정의 경우 세부항목이 없음
srchTraStDt	string	필수	훈련시작일 From	
srchTraEndDt	string	필수	훈련시작일 To	
srchTraProcessNm	string	선택	훈련과정명	
srchTraOrganNm	string	선택	훈련기관명	
sort	string	필수	정렬방법	"ASC",
"DESC"
sortCol	string	필수	정렬컬럼	훈련기관명 : 1
훈련시작일 : 2
훈련기관 직종별 취업률 : 3
만족도점수 : 4
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_cnt>	string	검색된 총 건수	</scn_cnt>
<pageNum>	string	현재페이지	</pageNum>
<pageSize>	string	페이지당 출력개수, 페이지당 표현될 자료의 개수	</pageSize>
<srchList>	string		
<scn_list>			
ADDRESS	string	주소	<address></address>
CERTIFICATE	string	자격증	<certificate></certificate>
CONTENTS	string	컨텐츠	<contents></contents>
COURSE_MAN	string	수강비	<courseMan></courseMan>
GRADE	string	등급	<grade></grade>
INST_CD	string	훈련기관 코드	<instCd></instCd>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
REAL_MAN	string	실제 훈련비	<realMan></realMan>
REG_COURSE_MAN	string	수강신청 인원	<regCourseMan></regCourseMan>
SUB_TITLE	string	부 제목	<subTitle></subTitle>
SUB_TITLE_LINK	string	부 제목 링크	<subTitleLink></subTitleLink>
TEL_NO	string	전화번호	<telNo></telNo>
TITLE	string	제목	<title></title>
TITLE_ICON	string	제목 아이콘	<titleIcon></titleIcon>
TITLE_LINK	string	제목 링크	<titleLink></titleLink>
TRA_END_DATE	string	훈련종료일자	<traEndDate></traEndDate>
TRA_START_DATE	string	훈련시작일자	<traStartDate></traStartDate>
TRAIN_TARGET	string	훈련대상	<trainTarget></trainTarget>
TRAIN_TARGET_CD	string	훈련구분	<trainTargetCd></trainTargetCd>
TRAINST_CST_ID	string	훈련기관ID	<trainstCstId></trainstCstId>
TRNG_AREA_CD	string	지역코드(중분류)	<trngAreaCd></trngAreaCd>
TRPR_DEGR	string	훈련과정 순차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
YARD_MAN	string	정원	<yardMan></yardMan>
</scn_list>			
</srchList>			
</HRDNet>

국가인적자원개발 컨소시엄 훈련과정 API - 과정/기관정보
안내

국가인적자원개발 컨소시엄 훔련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312D01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312D01.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	필수	훈련과정 회차
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<inst_base_info>		훈련기관 기초정보	
ADDR1	string	주소지	<addr1></addr1>
ADDR2	string	상세주소	<addr2></addr2>
FILE_PATH	string	파일경로	<filePath></filePath>
HP_ADDR	string	홈페이지 주소	<hpAddr></hpAddr>
INO_NM	string	훈련기관명	<inoNm></inoNm>
INST_INO	string	훈련기관 코드	<instIno></instIno>
INST_PER_TRCO	string	실제 훈련비	<instPerTrco></instPerTrco>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
NCS_NM	string	NCS 명	<ncsNm></ncsNm>
NCS_YN	string	NCS 여부	<ncsYn></ncsYn>
NON_NCS_COURSE_PRCTTQ_TIME	string	비 NCS교과 실기시간	<nonNcsCoursePrcttqTime></nonNcsCoursePrcttqTime>
NON_NCS_COURSE_THEORY_TIME	string	비 NCS교과 이론시간	<nonNcsCourseTheoryTime></nonNcsCourseTheoryTime>
P_FILE_NAME	string	로고 파일명	<pFileName></pFileName>
PER_TRCO	string	정부지원금	<perTrco></perTrco>
TORG_PAR_GRAD	string	평가등급	<torgParGrad></torgParGrad>
TR_DCNT	string	총 훈련일수	<trDcnt></trDcnt>
TR_GBN	string	'HRD'로 일정한 값 조회	<trGbn></trGbn>
TRAING_MTH_CD	string	훈련방법코드	<traingMthCd></traingMthCd>
TRPR_CHAP	string	담당자명	<trprChap></trprChap>
TRPR_CHAP_EMAIL	string	담당자 이메일	<trprChapEmail></trprChapEmail>
TRPR_CHAP_TEL	string	담당자 전화번호	<trprChapTel></trprChapTel>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_GBN	string	훈련과정 구분	<trprGbn></trprGbn>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
TRPR_TARGET	string	주요 훈련과정 구분	<trprTarget></trprTarget>
TRPR_TARGET_NM	string	주요 훈련과정 구분명	<trprTargetNm></trprTargetNm>
TRTM	string	총 훈련시간	<trtm></trtm>
ZIP_CD	string	우편번호	<zipCd></zipCd>
</inst_base_info>		훈련기관 기초정보	
<inst_detail_info>		훈련기관 상세정보	
GOV_BUSI_NM	string	훈련분야명	<govBusiNm></govBusiNm>
TORG_GBN_CD	string	훈련종류	<torgGbnCd></torgGbnCd>
TOT_TRAING_DYCT	string	훈련일수	<totTraingDyct></totTraingDyct>
TOT_TRAING_TIME	string	훈련시간	<totTraingTime></totTraingTime>
TGCR_GNRL_TRNE_OWEP_ALLT	string	본인부담액	<tgcrGnrlTrneOwepAllt></tgcrGnrlTrneOwepAllt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정코드	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</inst_detail_info>		훈련기관 상세정보	
<inst_facility_info>		시설 상세 정보	
<inst_facility_info_list>	시설 정보 리스트	
CHANGE_CSTMR_ID	string	변동훈련기관ID	<changeCstmrId></changeCstmrId>
CSTMR_ID	string	훈련기관ID	<cstmrId></cstmrId>
CSTRMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
FCLTY_AR_CN	string	시설 면적(㎡)	<fcltyArCn></fcltyArCn>
HOLD_QY	string	시설 수	<holdQy></holdQy>
OCU_ACPTN_CN	string	인원 수(명)	<ocuAcptnNmprCn></ocuAcptnNmprCn>
TRAFCLTY_NM	string	시설명	<trafcltyNm></trafcltyNm>
</inst_facility_info_list>	시설 정보 리스트	
</inst_facility_info>		시설 상세정보	
<inst_eqnm_info>		장비 상세 정보	
<inst_eqnm_info_list>	장비 정보 리스트	
CSTMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
EQPMN_NM	string	장비명	<eqpmnNm></eqpmnNm>
HOLD_QY	string	보유 수량	<holdQy></holdQy>
</inst_eqnm_info_list>	장비 정보 리스트	
</inst_eqnm_info>		장비 상세 정보	
</HRDNet>		

국가인적자원개발 컨소시엄 훈련과정 API - 훈련일정
안내

국가인적자원개발 컨소시엄 훔련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312D02.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo312D02.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	선택	훈련과정 회차(입력하지 않으면 모든 회차가 조회됩니다.)
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_list>	string		
EI_EMPL_RATE_3	string	3개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate3></eiEmplRate3>
EI_EMPL_CNT_3	string	3개월 고용보험 취업인원	<eiEmplCnt3></eiEmplCnt3>
EI_EMPL_RATE_6	string	6개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate6></eiEmplRate6>
EI_EMPL_CNT_6	string	6개월 고용보험 취업인원	<eiEmplCnt6></eiEmplCnt6>
HRD_EMPL_RATE_6	string	6개월 고용보험 미가입 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<hrdEmplRate6></hrdEmplRate6>
HRD_EMPL_CNT_6	string	6개월 고용보험 미가입 취업인원	<hrdEmplCnt6></hrdEmplCnt6>
INST_INO	string	훈련기관 코드	<instIno></instIno>
TOT_FXNUM	string	모집인원(정원)	<totFxnum></totFxnum>
TOT_PAR_MKS	string	수강인원	<totParMks></totParMks>
TOT_TRCO	string	총 훈련비	<totTrco></totTrco>
TOT_TRP_CNT	string	수강(신청) 인원	<totTrpCnt></totTrpCnt>
TR_END_DT	string	훈련종료일	<trEndDt></trEndDt>
TR_STA_DT	string	훈련 시작일	<trStaDt></trStaDt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</scn_list>	string		
</HRDNet>

5. JOB_SEEKER_EMPLOYMENT      # 구직자취업역량 강화프로그램
구직자취업역량 강화프로그램 API - 구직자취업역량 강화프로그램
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo217L01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo217L01.do?authKey=[인증키]&returnType=XML&startPage=1&display=10 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
pgmStdt	String	N	과정시작일
*미입력 시 오늘 일자로 조회됩니다.
topOrgCd	String	N	고용센터 관할 청 코드(코드표 1 depth)고용지청/센터코드 보기
orgCd	String	N	고용센터 코드(코드표 2 depth)고용지청/센터코드 보기
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<empPgmSchdInviteList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<empPgmSchdInvite>			
<orgNm>	String	고용센터명	</orgNm>
<pgmNm>	String	프로그램명	</pgmNm>
<pgmSubNm>	String	과정명	</pgmSubNm>
<pgmTarget>	String	대상자	</pgmTarget>
<pgmStdt>	String	과정시작일( YYYYMMDD )	</pgmStdt>
<pgmEndt>	String	과정종료일( YYYYMMDD )	</pgmEndt>
<openTimeClcd>	String	오전, 오후 구분
  - 오전 : 1
  - 오후 : 2	</openTimeClcd>
<openTime>	String	시작시간( HH:MM )
  - 24시 표현식이 아닌 12시 표현 방식으로 제공됩니다
  - ex) 오전 10시 > 10:00
  - 오후 10시 > 10:00	</openTime>
<operationTime>	String	운영시간	</operationTime>
<openPlcCont>	String	개최장소	</openPlcCont>
</smallGiant>			
</empPgmSchdInviteList>

5. WORK_WITH_STUDY_TRAINING   # 일학습병행 훈련과정
일학습병행 훈련과정 API - 목록
안내

일학습병행 훈련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313L01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&sort=ASC&sortCol=2 
복사
예제2) 선택조건을 추가하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313L01.do?authKey=[인증키]&returnType=XML&outType=1&pageNum=1&pageSize=20&srchTraStDt=20141001&srchTraEndDt=20141231&srchTraArea1=[훈련지역 대분류]&sort=ASC&sortCol=2 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)
pageNum	string	필수	시작페이지. 기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다. 최대 1000 까지 가능.
pageSize	string	필수	페이지당 출력건수, 기본값 10, 최대 100까지 가능.
srchTraArea1	string	선택	훈련지역 대분류	'11' : 서울, '26' : 부산, '27' : 대구, '28' : 인천 '29' : 광주, '30' : 대전, '31' : 울산, '36' : 세종, '41' : 경기, '43' : 충북, '44' : 충남, '45' : 전북, '46' : 전남, '47' : 경북, '48' : 경남, '50' : 제주, '51' : 강원
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraArea2	string	선택	훈련지역 중분류
훈련지역 대분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
srchNcs1	string	선택	NCS 직종 1차분류 코드	'01' : 사업관리
'02' : 경영/회계/사무
'03' : 금융/보험
'04' : 교육/자연/사회과학
'05' : 법률/경찰/소방/교도/국방
'06' : 보건/의료
'07' : 사회복지/종교
'08' : 문화/예술/디자인/방송
'09' : 운전/운송
'10' : 영업판매
'11' : 경비/청소
'12' : 이용/숙박/여행/오락/스포츠	'13' : 음식서비스
'14' : 건설
'15' : 기계
'16' : 재료
'17' : 화학/바이오
'18' : 섬유/의복
'19' : 전기/전자
'20' : 정보통신
'21' : 식품가공
'22' : 인쇄/목재/가구/공예
'23' : 환경/에너지/안전
'24' : 농림어업
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs2	string	선택	NCS 직종 2차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs3	string	선택	NCS 직종 3차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchNcs4	string	선택	NCS 직종 4차분류 코드
상위분류에 따라 내용이 달라짐	* 해당 코드관련 API 제공
* 전체일 경우에는 옵션 파라미터의 미등록처리
crseTracseSe	string	선택	훈련유형	'C0057SYY' : 단독기업형
'C0057SY' : 아우스빌둥
'C0057DYY' : 공동훈련센터형
'C0058A' : 도제학교
'C0063I' : IPP
'C0065UY' : Uni-tech
'C0057DY' : P-TECH
'C0065Y' : 전문대-재학생단계
'C0057DSY' : 민간자율형
'C0057F' : 외국인유학생
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraGbn	string	선택	훈련구분코드	'M1001' : 일반과정
'M1005' : 인터넷과정
'M1010' : 혼합과정(BL)
'M1014' : 스마트혼합훈련
* 전체일 경우에는 옵션 파라미터의 미등록처리
srchTraType	string	선택	훈련종류(훈련구분에 따라 세부내용이 변경됨)	'* 해당 코드관련 API 제공
* 훈련지역 대분류 제외시 이항목도 옵션 파라미터에 미등록처리
* 인터넷과정과 혼합과정의 경우 세부항목이 없음
srchTraStDt	string	필수	훈련시작일 From	
srchTraEndDt	string	필수	훈련시작일 To	
srchTraProcessNm	string	선택	훈련과정명	
srchTraOrganNm	string	선택	훈련기관명	
sort	string	필수	정렬방법	"ASC",
"DESC"
sortCol	string	필수	정렬컬럼	훈련기관명 : 1
훈련시작일 : 2
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_cnt>	string	검색된 총 건수	</scn_cnt>
<pageNum>	string	현재페이지	</pageNum>
<pageSize>	string	페이지당 출력개수, 페이지당 표현될 자료의 개수	</pageSize>
<srchList>	string		
<scn_list>			
ADDRESS	string	주소	<address></address>
CERTIFICATE	string	자격증	<certificate></certificate>
CONTENTS	string	컨텐츠	<contents></contents>
COURSE_MAN	string	수강비	<courseMan></courseMan>
GRADE	string	등급	<grade></grade>
INST_CD	string	훈련기관 코드	<instCd></instCd>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
REAL_MAN	string	실제 훈련비	<realMan></realMan>
REG_COURSE_MAN	string	수강신청 인원	<regCourseMan></regCourseMan>
SUB_TITLE	string	부 제목	<subTitle></subTitle>
SUB_TITLE_LINK	string	부 제목 링크	<subTitleLink></subTitleLink>
TEL_NO	string	전화번호	<telNo></telNo>
TITLE	string	제목	<title></title>
TITLE_ICON	string	제목 아이콘	<titleIcon></titleIcon>
TITLE_LINK	string	제목 링크	<titleLink></titleLink>
TRA_END_DATE	string	훈련종료일자	<traEndDate></traEndDate>
TRA_START_DATE	string	훈련시작일자	<traStartDate></traStartDate>
TRAIN_TARGET	string	훈련대상	<trainTarget></trainTarget>
TRAIN_TARGET_CD	string	훈련구분	<trainTargetCd></trainTargetCd>
TRAINST_CST_ID	string	훈련기관ID	<trainstCstId></trainstCstId>
TRNG_AREA_CD	string	지역코드(중분류)	<trngAreaCd></trngAreaCd>
TRPR_DEGR	string	훈련과정 순차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
YARD_MAN	string	정원	<yardMan></yardMan>
</scn_list>			
</srchList>			
</HRDNet>

일학습병행 훈련과정 API - 과정/기관정보
안내

일학습병행 훈련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313D01.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313D01.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	필수	훈련과정 회차
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<inst_base_info>		훈련기관 기초정보	
ADDR1	string	주소지	<addr1></addr>
ADDR2	string	상세주소	<addr2></addr2>
FILE_PATH	string	파일경로	<filePath></filePath>
HP_ADDR	string	홈페이지 주소	<hpAddr></hpAddr>
INO_NM	string	훈련기관명	<inoNm></inoNm>
INST_INO	string	훈련기관 코드	<instIno></instIno>
INST_PER_TRCO	string	실제 훈련비	<instPerTrco></instPerTrco>
NCS_CD	string	NCS 코드	<ncsCd></ncsCd>
NCS_NM	string	NCS 명	<ncsNm></ncsNm>
NCS_YN	string	NCS 여부	<ncsYn></ncsYn>
NON_NCS_COURSE_PRCTTQ_TIME	string	비 NCS교과 실기시간	<nonNcsCoursePrcttqTime></nonNcsCoursePrcttqTime>
NON_NCS_COURSE_THEORY_TIME	string	비 NCS교과 이론시간	<nonNcsCourseTheoryTime></nonNcsCourseTheoryTime>
P_FILE_NAME	string	로고 파일명	<pFileName></pFileName>
PER_TRCO	string	정부지원금	<perTrco></perTrco>
TORG_PAR_GRAD	string	평가등급	<torgParGrad></torgParGrad>
TR_DCNT	string	총 훈련일수	<trDcnt></trDcnt>
TR_GBN	string	'HRD'로 일정한 값 조회	<trGbn></trGbn>
TRAING_MTH_CD	string	훈련방법코드	<traingMthCd></traingMthCd>
TRPR_CHAP	string	담당자명	<trprChap></trprChap>
TRPR_CHAP_EMAIL	string	담당자 이메일	<trprChapEmail></trprChapEmail>
TRPR_CHAP_TEL	string	담당자 전화번호	<trprChapTel></trprChapTel>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_GBN	string	훈련과정 구분	<trprGbn></trprGbn>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
TRPR_TARGET	string	주요 훈련과정 구분	<trprTarget></trprTarget>
TRPR_TARGET_NM	string	주요 훈련과정 구분명	<trprTargetNm></trprTargetNm>
TRTM	string	총 훈련시간	<trtm></trtm>
ZIP_CD	string	우편번호	<zipCd></zipCd>
</inst_base_info>		훈련기관 기초정보	
<inst_detail_info>		훈련기관 상세정보	
GOV_BUSI_NM	string	훈련분야명	<govBusiNm></govBusiNm>
TORG_GBN_CD	string	훈련종류	<torgGbnCd></torgGbnCd>
TOT_TRAING_DYCT	string	훈련일수	<totTraingDyct></totTraingDyct>
TOT_TRAING_TIME	string	훈련시간	<totTraingTime></totTraingTime>
TGCR_GNRL_TRNE_OWEP_ALLT	string	본인부담액	<tgcrGnrlTrneOwepAllt></tgcrGnrlTrneOwepAllt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정코드	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</inst_detail_info>		훈련기관 상세정보	
<inst_facility_info>		시설 상세 정보	
<inst_facility_info_list>	시설 정보 리스트	
CHANGE_CSTMR_ID	string	변동훈련기관ID	<changeCstmrId></changeCstmrId>
CSTMR_ID	string	훈련기관ID	<cstmrId></cstmrId>
CSTRMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
FCLTY_AR_CN	string	시설 면적(㎡)	<fcltyArCn></fcltyArCn>
HOLD_QY	string	시설 수	<holdQy></holdQy>
OCU_ACPTN_CN	string	인원 수(명)	<ocuAcptnNmprCn></ocuAcptnNmprCn>
TRAFCLTY_NM	string	시설명	<trafcltyNm></trafcltyNm>
</inst_facility_info_list>	시설 정보 리스트	
</inst_facility_info>		시설 상세정보	
<inst_eqnm_info>		장비 상세 정보	
<inst_eqnm_info_list>	장비 정보 리스트	
CSTMR_NM	string	등록훈련기관	<cstmrNm></cstmrNm>
EQPMN_NM	string	장비명	<eqpmnNm></eqpmnNm>
HOLD_QY	string	보유 수량	<holdQy></holdQy>
</inst_eqnm_info_list>	장비 정보 리스트	
</inst_eqnm_info>		장비 상세 정보	
</HRDNet>		

일학습병행 훈련과정 API - 훈련일정
안내

일학습병행 훈련과정을 대상으로 실시하는 훈련과정 API를 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313D02.do 
복사
2. 사용예제
예제1) 기본 조건만을 이용하여 검색하는 경우

https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313D02.do?authKey=[인증키]&returnType=XML&outType=2&srchTrprId=[훈련과정ID]&srchTrprDegr=[훈련회차]&srchTorgId=[훈련기관ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	string	필수	인증키(ex : authKey=[인증키]
returnType	string	필수	리턴타입:XML, JSON 중 하나로 지정합니다.	(ex : returnType=XML)
outType	string	필수	구분자 : 출력형태('1':리스트 '2':상세)	'2'
srchTrprId	string	필수	훈련과정 ID
srchTrprDegr	string	선택	훈련과정 회차(입력하지 않으면 모든 회차가 조회됩니다.)
4. 출력결과
출력항목,타입,설명,비고을(를) 제공하는 표
출력항목	타입	설명	비고
<HRDNet>		XML문서의 최상위 노드입니다.	
<scn_list>	string		
EI_EMPL_RATE_3	string	3개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate3></eiEmplRate3>
EI_EMPL_CNT_3	string	3개월 고용보험 취업인원	<eiEmplCnt3></eiEmplCnt3>
EI_EMPL_RATE_6	string	6개월 고용보험 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<eiEmplRate6></eiEmplRate6>
EI_EMPL_CNT_6	string	6개월 고용보험 취업인원	<eiEmplCnt6></eiEmplCnt6>
HRD_EMPL_RATE_6	string	6개월 고용보험 미가입 취업률(%)
'A‘ : 개설예정
‘B‘ : 진행중
‘C‘ : 미실시
‘D‘ : 수료자 없음
숫자 : 취업률	<hrdEmplRate6></hrdEmplRate6>
HRD_EMPL_CNT_6	string	6개월 고용보험 미가입 취업인원	<hrdEmplCnt6></hrdEmplCnt6>
INST_INO	string	훈련기관 코드	<instIno></instIno>
TOT_FXNUM	string	모집인원(정원)	<totFxnum></totFxnum>
TOT_PAR_MKS	string	수강인원	<totParMks></totParMks>
TOT_TRCO	string	총 훈련비	<totTrco></totTrco>
TR_END_DT	string	훈련종료일	<trEndDt></trEndDt>
TR_STA_DT	string	훈련 시작일	<trStaDt></trStaDt>
TRPR_DEGR	string	훈련과정 회차	<trprDegr></trprDegr>
TRPR_ID	string	훈련과정ID	<trprId></trprId>
TRPR_NM	string	훈련과정명	<trprNm></trprNm>
</scn_list>	string		
</HRDNet>	

6. SMALL_GIANT_COMPANY        # 강소기업
강소기업 API - 강소기업
안내

강소기업 API를 이용하여 '규모는 작지만 강한 경쟁력을 가진 우수기업'목록을 활용 하실 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L01.do?authKey=[인증키]&returnType=XML&startPage=1&display=10 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
region	String	N	기업소재지역을 입력합니다.기관소재지코드 보기
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<smallGiantsList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<smallGiant>			
<selYear>	String	선정연도(등록연도)	</selYear>
<sgBrandNm>	String	강소기업브랜드명
*공통코드API의 강소기업코드 참고	</sgBrandNm>
<coNm>	String	기업명	</coNm>
<busiNo>	String	사업자등록번호	</busiNo>
<reperNm>	String	대표자	</reperNm>
<superIndTpCd>	String	업종코드(상)	</superIndTpCd>
<superIndTpNm>	String	업종명(상)	</superIndTpNm>
<indTpCd>	String	업종코드(중)	</indTpCd>
<indTpNm>	String	업종명(중)	</indTpNm>
<coTelNo>	String	사업장연락처	</coTelNo>
<regionCd>	String	지역코드	</regionCd>
<regionNm>	String	지역명	</regionNm>
<coAddr>	String	주소	</coAddr>
<coMainProd>	String	주요생산품목	</coMainProd>
<coHomePage>	String	회사홈페이지	</coHomePage>
<alwaysWorkerCnt>	String	상시근로자 수	</alwaysWorkerCnt>
<smlgntCoClcd>	String	강소기업 브랜드명 코드	</smlgntCoClcd>
</smallGiant>			
</smallGiantsList>

강소기업 API - 강소기업현장탐방기
안내

강소기업현장탐방기 API를 활용하여 작지만 강한 강소기업의 진솔하고 생생한 탐방기를 구성할 수 있습니다.

강소기업현장탐방기 목록

강소기업현장탐방기 상세
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L11.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L11.do?authKey=[인증키]&returnType=XML&callTp=L&startPage=1&display=10 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
regionCd	String		지역을 입력합니다. 지역코드 보기
indTypeCd	String		업종을 입력합니다. 업종코드 보기
compNm	String		기업명 키워드 검색시 입력합니다.(예: 한국고용정보원, 고용노동부)
UTF-8 인코딩입니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<compSpotInqList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<company>			
<busiNo>	String	사업자등록번호	</busiNo>
<compNm>	String	기업명	</compNm>
<regionNm>	String	지역명	</regionNm>
<indTypeNm>	String	업종명	</indTypeNm>
<smlgntCoClcd>	String	기업특징	</smlgntCoClcd>
<collectDtm>	String	취재일	</collectDtm>
</company>			
</compSpotInqList>

강소기업 API - 청년강소기업체험
안내

청년강소기업체험 API를 이용하여 다채로운 기관의 청년연수정보를 한눈에 확인할 수 있습니다.

직업체험 목록

직업체험 상세
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L21.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L21.do?authKey=[인증키]&callTp=L&returnType=XML&startPage=1&display=10&sregDtmValCd=6 
복사
예제2) 다중검색(다중검색 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L21.do?authKey=[인증키] &callTp=L&returnType=XML&startPage=1&display=10&sregDtmValCd=6&occupation=[직종코드1|직종코드2] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
callTp	String	Y	호출할 페이지 타입을 반드시 설정합니다.(L: 목록, D:상세)
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
region	String	 	(다중검색 가능)
근무지역코드를 입력합니다. 근무지역코드 보기
occupation	String	 	(다중검색 가능)
직종코드를 입력합니다. 직종코드 보기
sregDtmValCd	Number	Y	검색할 등록일자의 기간을 선택합니다.
- 1 : 오늘
- 2 : 3일
- 3: 1주이내
- 4 : 2주이내
- 5 : 한달
- 6 : 전체
traSchStdt	String		연수기간조회 시작일자 기간검색을 합니다.
- 조회일자 이후가 포함되는 연수기간을 기준으로 기간검색을 합니다.
traSchEndt	String		연수기간조회 종료일자 기간검색을 합니다.
- 조회일자 이전이 포함되는 연수기간을 기준으로 기간검색을 합니다.
custNm	String		사업장명을 입력합니다.
orgNm	String		운영기관명을 입력합니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<traOrgList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<traOrg>			
<wantedAuthNo>	String	구인인증번호	</wantedAuthNo>
<traOrgNm>	String	운영기관명	</traOrgNm>
<dtlSmlgntYn>	String	강소기업 여부(Y)	</dtlSmlgntYn>
<traCustNm>	String	사업장명	</traCustNm>
<collectJobsNm>	String	모집직종	</collectJobsNm>
<regionNm>	String	연수지역	</regionNm>
<selPsncnt>	String	선발인원	</selPsncnt>
<collectPsncnt>	String	모집인원	</collectPsncnt>
<traStdt>	String	연수기간 시작일	</traStdt>
<traEndt>	String	연수기간 종료일	</traEndt>
<regDt>	String	등록일	</regDt>
</traOrg>			
</traOrgList>

강소기업 API - 청년친화강소기업
안내

고용노동부에서 선정한 청년에게 추천하는 작지만 강한기업 '청년친화강소기업' 입니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L31.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L31.do?authKey=[인증키]&returnType=XML&startPage=1&display=10 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	xml 를 반드시 지정합니다.
startPage	Number	Y	기본값 1, 최대 1000 검색 시작위치를 지정할 수 있습니다.
최대 1000 까지 가능합니다.
display	Number	Y	출력건수, 기본값 10, 최대 100 까지 가능합니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<smallGiantsList>			
<total>	Number	총건수	</total>
<startPage>	Number	기본값 1, 최대 1000 검색의 시작위치를 지정 할 수 있습니다.	</startPage>
<display>	Number	출력건수, 기본값 10	</display>
<smallGiant>			
<coNm>	String	기업명	</coNm>
<busiNo>	String	사업자등록번호	</busiNo>
<reperNm>	String	대표자	</reperNm>
<superIndTpCd>	String	업종코드(상)	</superIndTpCd>
<superIndTpNm>	String	업종명(상)	</superIndTpNm>
<indTpCd>	String	업종코드(중)	</indTpCd>
<indTpNm>	String	업종명(중)	</indTpNm>
<regionCd>	String	지역코드	</regionCd>
<regionNm>	String	지역명	</regionNm>
<alwaysWorkerCnt>	String	상시근로자 수	</alwaysWorkerCnt>
</smallGiant>			
</smallGiantsList>

7. DEPARTMENT_INFO            # 학과정보
학과정보 API - 학과정보 목록
안내

학과정보 키워드 검색, 조건별 검색으로 학과목록 정보를 검색할 수 있고, 학과요약보기에 대한 정보를 학과정보 API를 통해 이용할 수 있습니다.
검색조건에 해당하는 학과목록을 제공합니다.
학과구분에 따라 일반학과, 이색학과의 상세 정보를 제공합니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213L01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213L01.do?authKey=[인증키]&returnType=XML&target=MAJORCD&srchType=K&keyword=[키워드] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
학과계열 카테고리 보기
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : MAJORCD 를 반드시 지정합니다.
srchType	String	Y	
검색타입을 반드시 지정합니다.

- A : 전체검색(All)
- K : 키워드검색(keyword)
keyword	String	Y	학과명 키워드 검색시 입력합니다.(예: 금융 , 디자인)
UTF-8 인코딩입니다.
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<majorsList>			
<total>	Number	총건수	</total>
<majorList>			
<majorGb>	String	학과구분코드
- 1 : 일반학과
- 2 : 이색학과	</majorGb>
<knowDtlSchDptNm>	String	세부학과명	</knowDtlSchDptNm>
<knowSchDptNm>	String	학과명	</knowSchDptNm>
<empCurtState1Id>	String	계열(학과분류)ID
* 공통코드API의 학과계열코드 참고	</empCurtState1Id>
<empCurtState2Id>	String	학과ID
* 공통코드API의 학과계열코드 참고	</empCurtState2Id>
</majorList>			
</majorsList>

학과정보 API - 일반학과 상세
안내

학과정보 키워드 검색, 조건별 검색으로 학과목록 정보를 검색할 수 있고, 학과요약보기에 대한 정보를 학과정보 API를 통해 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213D01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213D01.do?authKey=[인증키]&returnType=XML&target=MAJORDTL&majorGb=1&empCurtState1Id=[계열ID]&empCurtState2Id=[학과ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
학과계열 카테고리 보기
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : MAJORDTL 를 반드시 지정합니다.
majorGb	String	Y	학과구분코드 : 1 을 반드시 지정합니다.
empCurtState1Id	String	Y	계열ID 입력
empCurtState2Id	String	Y	학과ID 입력
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<majorSum>			
<knowDptNm>	String	계열명	</knowDptNm>
<knowSchDptNm>	String	학과명	</knowSchDptNm>
<knowDptId>	String	계열ID
* 공통코드API의 학과계열코드 참고	</knowDptId>
<knowSchDptId>	String	학과ID
* 공통코드API의 학과계열코드 참고	</knowSchDptId>
<schDptIntroSum>	String	학과소개 개요	</schDptIntroSum>
<aptdIntrstCont>	String	적성/흥미 내용	</aptdIntrstCont>
<relSchDptList>			
<knowDtlSchDptNm>	String	관련학과	</knowDtlSchDptNm>
</relSchDptList>			
<mainSubjectList>			
<mainEdusbjCont>	String	주요 교과목	</mainEdusbjCont>
</mainSubjectList>			
<licList>			
<adoptCertCont>	String	취득 자격	</adoptCertCont>
</licList>			
<schDptList>			
<schDptNm>	String	개설 대학 전공	</schDptNm>
<univGbnNm>	String	개설 대학교 구분	</univGbnNm>
<univNm>	String	개설 대학교	</univNm>
<univUrl>	String	개설 대학교 URL	</univUrl>
</schDptList>			
<relAdvanJobsList>			
<knowJobNm>	String	관련직업명	</knowJobNm>
</relAdvanJobsList>			
<recrStateList>		모집현황	
<enscMxnp>	Number	입학정원인원수	</enscMxnp>
<enscSpnb>	Number	입학지원자인원수	</enscSpnb>
<grdnNmpr>	Number	졸업인원수	</grdnNmpr>
<univGbnNm>	String	대학교구분	</univGbnNm>
<year>	String	연도	</year>
</recrStateList>			
</majorSum>

학과정보 API - 이색학과 상세
안내

학과정보 키워드 검색, 조건별 검색으로 학과목록 정보를 검색할 수 있고, 학과요약보기에 대한 정보를 학과정보 API를 통해 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213D02.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo213D02.do?authKey=[인증키]&returnType=XML&target=MAJORDTL&majorGb=2&empCurtState1Id=[계열ID]&empCurtState2Id=[학과ID] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
학과계열 카테고리 보기
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : MAJORDTL 입력
majorGb	String	Y	학과구분코드 : 2 를 반드시 지정합니다.
empCurtState1Id	String	Y	계열ID 입력
empCurtState2Id	String	Y	학과ID 입력
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<specMajor>			
<knowDptNm>	String	계열명	</knowDptNm>
<knowSchDptNm>	String	학과명	</knowSchDptNm>
<knowDptId>	String	계열ID
* 공통코드API의 학과계열코드 참고	</knowDptId>
<knowSchDptId>	String	학과ID
* 공통코드API의 학과계열코드 참고	</knowSchDptId>
<schDptIntroSum>	String	학과소개 개요	</schDptIntroSum>
<whatStudy>	String	하는 공부	</whatStudy>
<howPrepare>	String	준비방법	</howPrepare>
<jobPropect>	String	직업 전망	</jobPropect>
</specMajor>
8. JOB_INFORMATION            # 직업정보
직업정보 API - 직업정보
안내

직업정보 키워드 검색, 조건별 검색, 분류별 카테고리 정보로 직업명을 검색할 수 있고, 직업상세에 대한 정보를 직업정보 API를 통해 이용할 수 있습니다.
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do?authKey=[인증키]&returnType=XML&target=JOBCD 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBCD 를 반드시 지정합니다.
srchType	String	N	
검색타입을 입력합니다.(미입력시 K: 키워드 검색으로 검색됩니다.)


- 단일 검색만 가능
K: 키워드 검색
C: 조건별 검색(연봉/전망)
keyword	String	N	
검색타입이 K일 경우에만 사용합니다.


직업명 키워드 검색시 입력합니다.(예: 컨설턴트 , 환경)
UTF-8 인코딩입니다.
avgSal	String	N	
검색타입이 C일 경우에만 사용합니다.


평균연봉을 입력합니다.(평균연봉을 미입력시 전체로 검색됩니다.)
- 10: 3천만원 미만
- 20: 3~4천만원 미만
- 30: 4~5천만원 미만
- 40: 5천만원 이상
prospect	String	N	
검색타입이 C일 경우에만 사용합니다.


직업전망을 입력합니다.(직업전망을 미입력시 전체로 검색됩니다.)
- 1: 증가
- 2: 다소 증가
- 3: 유지
- 4: 다소 감소
- 5: 감소
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<jobsList>			
<total>	Number	총건수	</total>
<jobList>			
<jobClcd>	String	직업분류코드	</jobClcd>
<jobClcdNM>	String	직업분류명	</jobClcdNM>
<jobCd>	String	직업코드	</jobCd>
<jobNm>	String	직업명	</jobNm>
</jobList>			
</jobsList>

직업정보 API - 직업정보 상세
안내

직업정보 키워드 검색, 조건별 검색, 분류별 카테고리 정보로 직업명을 검색할 수 있고, 직업상세에 대한 정보를 직업정보 API를 통해 이용할 수 있습니다.

요약
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D01.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D01.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<jobSum>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<jobSum>	String	하는일	</jobSum>
<way>	String	되는길	</way>
<relMajorList>			
<majorCd>	Number	관련전공코드	</majorCd>
<majorNm>	String	관련전공명	</majorNm>
</relMajorList>			
<relCertList>			
<certNm>	String	관련자격증명	</certNm>
</relCertList>			
<sal>	String	임금	</sal>
<jobSatis>	String	직업만족도(%)	</jobSatis>
<jobProspect>	String	일자리전망	</jobProspect>
<jobStatus>	String	일자리현황	</jobStatus>
<jobAbil>	String	업무수행능력	</jobAbil>
<knowldg>	String	지식	</knowldg>
<jobEnv>	String	업무환경	</jobEnv>
<jobChr>	String	성격	</jobChr>
<jobIntrst>	String	흥미	</jobIntrst>
<jobVals>	String	직업가치관	</jobVals>
<jobActvImprtncs>	String	업무활동 중요도	</jobActvImprtncs>
<jobActvLvls>	String	업무활동 수준	</jobActvLvls>
<relJobList>			
<jobCd>	Number	관련직업코드	</jobCd>
<jobNm>	String	관련직업명	</jobNm>
</relJobList>			
</jobSum>
9. JOB_DESCRIPTIONS           # 직무정보

하는 일
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D02.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D02.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<jobsDo>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<jobSum>	String	직무개요	</jobSum>
<execJob>	String	수행직무	</execJob>
<relJobList>			
<jobCd>	String	직업코드	</jobCd>
<jobNm>	String	직업명	</jobNm>
</relJobList>			
</jobsDo>

교육/자격/훈련
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D03.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D03.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<way>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<technKnow>	String	필수 기술 및 지식	</technKnow>
<edubg>			
<edubgMgraduUndr>	Number	학력분포 (%) : 중졸이하	</edubgMgraduUndr>
<edubgHgradu>	Number	학력분포 (%) : 고졸	</edubgHgradu>
<edubgCgraduUndr>	Number	학력분포 (%) : 전문대졸	</edubgCgraduUndr>
<edubgUgradu>	Number	학력분포 (%) : 대졸	</edubgUgradu>
<edubgGgradu>	Number	학력분포 (%) : 대학원졸	</edubgGgradu>
<edubgDgradu>	Number	학력분포 (%) : 박사졸	</edubgDgradu>
</edubg>			
<schDpt>			
<cultLangDpt>	Number	전공학과분포 (%): 인문계열	</cultLangDpt>
<socDpt>	Number	전공학과분포 (%): 사회계열	</socDpt>
<eduDpt>	Number	전공학과분포 (%): 교육계열	</eduDpt>
<engnrDpt>	Number	전공학과분포 (%): 공학계열	</engnrDpt>
<natrlDpt>	Number	전공학과분포 (%): 자연계열	</natrlDpt>
<mediDpt>	Number	전공학과분포 (%): 의학계열	</mediDpt>
<artphyDpt>	Number	전공학과분포 (%): 예체능계열	</artphyDpt>
</schDpt>			
<relMajorList>			
<majorCd>	String	전공코드	</majorCd>
<majorNm>	String	전공명	</majorNm>
</relMajorList>			
<relOrgList>			
<orgSiteUrl>	String	관련정보처 URL	</orgSiteUrl>
<orgNm>	String	관련정보처명	</orgNm>
</relOrgList>			
<relCertList>			
<certNm>	String	관련자격명	</certNm>
</relCertList>			
<kecoList>			
<kecoCd>	String	한국고용직업분류(KECO)코드	</kecoCd>
<kecoNm>	String	한국고용직업분류(KECO)코드명	</kecoNm>
</kecoList>			
</way>

임금/직업만족도/전망
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D04.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D04.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<salProspect>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<sal>	String	임금
- 위 임금정보는 직업당 평균 30명의 재직자를 대상으로 실시한 설문조사 결과로, 재직자의 자기보고에 근거한 통계치입니다. 재직자의 경력, 근무업체의 규모 등에 따라 실제 임금과 차이가 있을 수 있으니, 직업간 비교를 위한 참고자료로 활용하여 주시기 바랍니다
</sal>
<jobSatis>	String	직업만족도(%)	</jobSatis>
<jobProspect>	String	
일자리전망

- 일자리전망은 직업당 평균 30명의 재직자를 대상으로 향후 5년간 일자리 변화에 대해 물은 설문조사한 결과입니다. 재직자 개인 및 전문가의 견해에 따라 차이가 있을 수 있으므로, 직업간 비교를 위한 참고자료로 활용하시기 바랍니다.
</jobProspect>
<jobSumProspect>			
<jobProspectNm>	String	일자리전망(예 :많이 늘어남, 늘어남 등)	</jobProspectNm>
<jobProspectRatio>	String	일자리전망률	</jobProspectRatio>
<jobProspectInqYr>	Number	조사년도	</jobProspectInqYr>
</jobSumProspect>			
<jobStatusList>			
<jobCd>	String	일자리현황(직업코드)	</jobCd>
<jobNm>	String	일자리현황(직업명)	</jobNm>
</jobStatusList>			
</salProspect>

능력/지식/환경
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D05.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D05.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<ablKnwEnv>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<jobAbilCmpr>		직업 내 비교	
<jobAblStatusCmpr>	Number	업무수행능력 중요도 :
중요도(5점 만점)	</jobAblStatusCmpr>
<jobAblNmCmpr>	String	업무수행능력 중요도 :
업무수행능력	</jobAblNmCmpr>
<jobAblContCmpr>	String	업무수행능력 중요도 : 설명	</jobAblContCmpr>
</jobAbilCmpr>			
<jobAbil>		직업 간 비교	
<jobAblStatus>	Number	업무수행능력 중요도 :
중요도(0:낮음 ~ 100:높음)	</jobAblStatus>
<jobAblNm>	String	업무수행능력 중요도 :
업무수행능력	</jobAblNm>
<jobAblCont>	String	업무수행능력 중요도 : 설명	</jobAblCont>
</jobAbil>			
<jobAbilLvlCmpr>		직업 내 비교	
<jobAblLvlStatusCmpr>	Number	업무수행능력 수준 :
중요도(7점 만점)	</jobAblLvlStatusCmpr>
<jobAblLvlNmCmpr>	String	업무수행능력 수준 :
업무수행능력	</jobAblLvlNmCmpr>
<jobAblLvlContCmpr>	String	업무수행능력 수준 : 설명	</jobAblLvlContCmpr>
</jobAbilLvlCmpr>			
<jobAbilLvl>		직업 간 비교	
<jobAblLvlStatus>	Number	업무수행능력 수준 :
중요도(0:낮음 ~ 100:높음)	</jobAblLvlStatus>
<jobAblLvlNm>	String	업무수행능력 수준 :
업무수행능력	</jobAblLvlNm>
<jobAblLvlCont>	String	업무수행능력 수준 : 설명	</jobAblLvlCont>
</jobAbilLvl>			
<KnwldgCmpr>		직업 내 비교	
<knwldgStatusCmpr>	Number	지식중요도 :
중요도(5점 만점)	</knwldgStatusCmpr>
<knwldgNmCmpr>	String	지식중요도 : 업무수행능력	</knwldgNmCmpr>
<knwldgContCmpr>	String	지식중요도 : 설명	</knwldgContCmpr>
</KnwldgCmpr>			
<Knwldg>		직업 간 비교	
<knwldgStatus>	Number	지식중요도 :
중요도(0:낮음 ~ 100:높음)	</knwldgStatus>
<knwldgNm>	String	지식중요도 : 업무수행능력	</knwldgNm>
<knwldgCont>	String	지식중요도 : 설명	</knwldgCont>
</Knwldg>			
<KnwldgLvlCmpr>		직업 내 비교	
<knwldgLvlStatusCmpr>	Number	지식수준 :
중요도(7점 만점)	</knwldgLvlStatusCmpr>
<knwldgLvlNmCmpr>	String	지식수준 : 업무수행능력	</knwldgLvlNmCmpr>
<knwldgLvlContCmpr>	String	지식수준 : 설명	</knwldgLvlContCmpr>
</KnwldgLvlCmpr>			
<KnwldgLvl>		직업 간 비교	
<knwldgLvlStatus>	Number	지식수준 :
중요도(0:낮음 ~ 100:높음)	</knwldgLvlStatus>
<knwldgLvlNm>	String	지식수준 : 업무수행능력	</knwldgLvlNm>
<knwldgLvlCont>	String	지식수준 : 설명	</knwldgLvlCont>
</KnwldgLvl>			
<jobsEnvCmpr>		직업 내 비교	
<jobEnvStatusCmpr>	Number	업무환경 :
중요도(5점 만점)	</jobEnvStatusCmpr>
<jobEnvNmCmpr>	String	업무환경 : 업무수행능력	</jobEnvNmCmpr>
<jobEnvContCmpr>	String	업무환경 : 설명	</jobEnvContCmpr>
</jobsEnvCmpr>			
<jobsEnv>		직업 간 비교	
<jobEnvStatus>	Number	업무환경 :
중요도(0:낮음 ~ 100:높음)	</jobEnvStatus>
<jobEnvNm>	String	업무환경 : 업무수행능력	</jobEnvNm>
<jobEnvCont>	String	업무환경 : 설명	</jobEnvCont>
</jobsEnv>			
</ablKnwEnv>

성격/흥미/가치관
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D06.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D06.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목	타입	설명
<chrIntrVals>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<jobChrCmpr>		직업 내 비교	
<jobChrStatusCmpr>	Number	성격 : 중요도(5점 만점)	</jobChrStatusCmpr>
<jobChrNmCmpr>	String	성격 : 업무수행능력	</jobChrNmCmpr>
<jobChrContCmpr>	String	성격 : 설명	</jobChrContCmpr>
</jobChrCmpr>			
<jobChr>		직업 간 비교	
<jobChrStatus>	Number	성격 : 중요도(0:낮음 ~ 100:높음)	</jobChrStatus>
<jobChrNm>	String	성격 : 업무수행능력	</jobChrNm>
<jobChrCont>	String	성격 : 설명	</jobChrCont>
</jobChr>			
<jobIntrstCmpr>		직업 내 비교	
<intrstStatusCmpr>	Number	흥미 : 중요도(5점 만점)	</intrstStatusCmpr>
<intrstNmCmpr>	String	흥미 : 업무수행능력	</intrstNmCmpr>
<intrstContCmpr>	String	흥미 : 설명	</intrstContCmpr>
</jobIntrstCmpr>			
<jobIntrst>		직업 간 비교	
<intrstStatus>	Number	흥미 : 중요도(0:낮음 ~ 100:높음)	</intrstStatus>
<intrstNm>	String	흥미 : 업무수행능력	</intrstNm>
<intrstCont>	String	흥미 : 설명	</intrstCont>
</jobIntrst>			
<jobValsCmpr>		직업 내 비교	
<valsStatusCmpr>	Number	가치관 : 중요도(5점 만점)	</valsStatusCmpr>
<valsNmCmpr>	String	가치관 : 업무수행능력	</valsNmCmpr>
<valsContCmpr>	String	가치관 : 설명	</valsContCmpr>
</jobValsCmpr>			
<jobVals>		직업 간 비교	
<valsStatus>	Number	가치관 : 중요도(0:낮음 ~ 100:높음)	</valsStatus>
<valsNm>	String	가치관 : 업무수행능력	</valsNm>
<valsCont>	String	가치관 : 설명	</valsCont>
</jobVals>			
</chrIntrVals>

업무활동
1. 요청 URL
https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D07.do 
복사
2. 사용예제
예제1) 기본검색(필수 입력 예)

https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212D07.do?authKey=[인증키]&returnType=XML&target=JOBDTL&jobGb=1&jobCd=[직업코드]&dtlGb=[상세구분] 
복사

* 요청 Parameters 입력시 대괄호 []는 제외합니다.

3. 요청 Parameters
항목,타입,필수여부,설명을(를) 제공하는 표
항목	타입	필수여부	설명
authKey	String	Y	인증키
returnType	String	Y	리턴타입 : XML 을 반드시 지정합니다.
target	String	Y	구분자 : JOBDTL 을 반드시 지정합니다.
jobGb	String	Y	직업구분코드 : 1 을 반드시 지정합니다.
jobCd	String	Y	직업코드
* 직업목록 API 호출결과 참고
dtlGb	String	Y	
직업정보 상세구분을 지정합니다.

- 1 : 요약
- 2 : 하는 일
- 3 : 교육/자격/훈련
- 4 : 임금/직업만족도/전망
- 5 : 능력/지식/환경
- 6 : 성격/흥미/가치관
- 7 : 업무활동
4. 출력결과
항목,타입,설명을(를) 제공하는 표
항목		타입	설명
<jobActv>			
<jobCd>	String	직업코드	</jobCd>
<jobLrclNm>	String	직업 대분류명	</jobLrclNm>
<jobMdclNm>	String	직업 중분류명	</jobMdclNm>
<jobSmclNm>	String	직업 소분류명	</jobSmclNm>
<jobActvImprtncCmpr>		직업 내 비교	
<jobActvImprtncStatusCmpr>	Number	업무활동 중요도 :
중요도(5점 만점)	</jobActvImprtncStatusCmpr>
<jobActvImprtncNmCmpr>	String	업무활동 중요도 :
업무활동명	</jobActvImprtncNmCmpr>
<jobActvImprtncContCmpr>	String	업무활동 중요도 : 설명	</jobActvImprtncContCmpr>
</jobActvImprtncCmpr>			
<jobActvImprtnc>		직업 간 비교	
<jobActvImprtncStatus>	Number	업무활동 중요도 :
중요도(0:낮음 ~ 100:높음)	</jobActvImprtncStatus>
<jobActvImprtncNm>	String	업무활동 중요도 :
업무활동명	</jobActvImprtncNm>
<jobActvImprtncCont>	String	업무활동 중요도 : 설명	</jobActvImprtncCont>
</jobActvImprtnc>			
<jobActvLvlCmpr>		직업 내 비교	
<jobActvLvlStatusCmpr>	Number	업무활동 수준 :
수준(7점 만점)	</jobActvLvlStatusCmpr>
<jobActvLvlNmCmpr>	String	업무활동 수준 :
업무활동명	</jobActvLvlNmCmpr>
<jobActvLvlContCmpr>	String	업무활동 수준 : 설명	</jobActvLvlContCmpr>
</jobActvLvlCmpr>			
<jobActvLvl>		직업 간 비교	
<jobActvLvlStatus>	Number	업무활동 수준 :
수준(0:낮음 ~ 100:높음)	</jobActvLvlStatus>
<jobActvLvlNm>	String	업무활동 수준 :
업무활동명	</jobActvLvlNm>
<jobActvLvlCont>	String	업무활동 수준 : 설명	</jobActvLvlCont>
</jobActvLvl>			
</jobActv>