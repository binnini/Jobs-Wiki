import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Bookmark,
  Briefcase,
  Calendar as CalIcon,
  Check,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileQuestion,
  FileSearch,
  FileText,
  Folder,
  GitMerge,
  Grid,
  Lightbulb,
  Link as LinkIcon,
  List,
  Loader2,
  MapPin,
  MessageSquare,
  MoveRight,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
  Database,
} from "lucide-react";

// Temporary mock adapter that will later map to WAS.
// Frontend UI should not call model providers directly.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_PROFILE = {
  name: "김지훈",
  targetRole: "Backend Engineer",
  experience: "1년 (인턴십)",
  education: "컴퓨터공학과 학사",
  location: "서울/판교",
  domain: "금융, 커머스, 플랫폼",
  skills: ["Node.js", "REST API", "Docker", "SQL", "TypeScript"],
  goals: "대규모 트래픽 처리 경험을 쌓을 수 있는 코어 백엔드 직무",
  strengths: [
    "시스템 아키텍처 이해도",
    "API 설계 및 최적화",
    "컨테이너 기반 배포 경험",
  ],
  source: "Resume_v2.pdf, Github_Readme.md",
};

const MOCK_OPPORTUNITIES = [
  {
    id: 1,
    company: "토스페이먼츠",
    title: "코어 백엔드 엔지니어 (결제 시스템)",
    location: "서울 강남구",
    deadline: "2026-05-01",
    matchScore: 92,
    summary:
      "초당 수천 건의 결제 트래픽을 처리하는 코어 시스템을 개발하고 유지보수합니다. 트랜잭션 무결성 보장과 지연 시간 최소화가 핵심 과제입니다.",
    companyContext: {
      description:
        "국내 주요 결제 인프라를 담당하는 B2B 결제 플랫폼으로, 빠르게 증가하는 트래픽을 감당하기 위한 코어 시스템 고도화를 진행 중입니다.",
      whyRelevant:
        "지원자가 목표로 하는 대규모 트래픽 처리 경험을 빠르게 축적할 수 있는 환경이며, 현재 보유한 Node.js 및 API 설계 역량을 직접 활용할 수 있습니다.",
    },
    requirements: [
      "Node.js 또는 Java/Spring 개발 경험",
      "RDBMS 및 NoSQL 기반 데이터 모델링",
      "대용량 트래픽 처리 경험 우대",
      "마이크로서비스 아키텍처(MSA) 이해도",
    ],
    matchReason:
      "지원자의 Node.js 및 REST API 설계 역량과 부합하며, Docker를 활용한 배포 경험이 시스템 인프라 이해도 측면에서 강점으로 분석되었습니다.",
    gap:
      "대규모 트래픽 처리(Kafka, Redis) 실무 경험 및 분산 환경에서의 트랜잭션 제어 지식 보완이 권장됩니다.",
    urgency: "D-13",
    status: "recommend",
  },
  {
    id: 2,
    company: "당근마켓",
    title: "플랫폼 백엔드 개발자 (공통 인프라)",
    location: "서울 서초구",
    deadline: "2026-05-15",
    matchScore: 88,
    summary:
      "전사 서비스에서 공통으로 사용하는 플랫폼 API 및 마이크로서비스 아키텍처를 설계하고, 운영에 필요한 관측성과 자동화를 구축합니다.",
    companyContext: {
      description:
        "하이퍼로컬 커뮤니티 플랫폼을 운영하며, 다수 서비스가 공통으로 사용하는 인프라와 내부 플랫폼 역량을 강화하고 있습니다.",
      whyRelevant:
        "공통 플랫폼 조직 특성상 재사용 가능한 서버 설계 경험을 쌓기에 좋고, TypeScript 및 Docker 역량을 비교적 자연스럽게 확장할 수 있습니다.",
    },
    requirements: [
      "TypeScript, Node.js 기반 서버 개발 경험",
      "컨테이너 기반 인프라(Docker, Kubernetes) 이해",
      "RDBMS 쿼리 최적화",
    ],
    matchReason:
      "TypeScript 및 Docker 기술 스택이 프로필과 완전히 일치하며, 인턴십 기간 중 수행한 API 최적화 업무가 이 직무의 핵심 요구사항과 직결됩니다.",
    gap:
      "Kubernetes 기반 오케스트레이션 개념 숙지 및 CI/CD 파이프라인 구축 경험이 보강되면 더 강한 후보로 보일 수 있습니다.",
    urgency: "D-27",
    status: "recommend",
  },
  {
    id: 3,
    company: "카카오뱅크",
    title: "여수신 시스템 백엔드 엔지니어",
    location: "경기 성남시 판교",
    deadline: "2026-04-25",
    matchScore: 85,
    summary:
      "안정적인 금융 트랜잭션을 보장하는 여수신 코어 시스템을 개발합니다. 금융 규제와 보안 기준을 만족하는 아키텍처 설계가 중요합니다.",
    companyContext: {
      description:
        "인터넷전문은행의 핵심 서비스를 담당하며, 높은 신뢰성과 무결성이 요구되는 금융 시스템을 운영합니다.",
      whyRelevant:
        "목표하시는 판교/금융 도메인에 부합하며, 데이터 무결성과 트랜잭션 처리 역량을 심화할 수 있는 환경입니다.",
    },
    requirements: [
      "컴퓨터공학 전공 및 탄탄한 CS 지식",
      "SQL 및 트랜잭션 처리에 대한 깊은 이해",
      "금융 도메인 관심도",
    ],
    matchReason:
      "컴퓨터공학 전공 및 SQL 역량이 핵심 요구사항을 충족하며, 판교 지역 근무라는 목표 조건에도 부합합니다.",
    gap:
      "금융 도메인 특화 아키텍처 및 망분리 등 보안 규제에 대한 사전 이해가 있으면 설득력이 더 높아집니다.",
    urgency: "D-7",
    status: "urgent",
  },
];

const MockAppService = {
  async generateInterviewScenarios(job, profile) {
    await delay(1400);
    return [
      {
        question: `${job.company}의 환경을 고려할 때, 지원자님의 ${profile.skills[1]} 경험을 어떻게 실무 기여로 연결해 설명하시겠습니까?`,
        reason:
          "과거 경험과 현재 포지션 요구사항을 실무 언어로 연결할 수 있는지를 확인하기 위함입니다.",
        framework:
          "1. 실제 성과 지표 제시\n2. 현재 공고 요구사항과의 연결\n3. 입사 후 즉시 기여 가능한 포인트 제안",
      },
      {
        question: `주요 우대사항인 '${job.requirements[2]}'와 관련해, 병목 상황을 발견하고 해결하는 본인만의 접근법을 설명해 주세요.`,
        reason:
          "문제 해결 사고력과 장애 대응 관점을 함께 검증하기 위함입니다.",
        framework:
          "1. 병목 정의\n2. 원인 가설 수립\n3. 측정/검증\n4. 개선과 재발 방지",
      },
    ];
  },

  async askWorkspace(query, activeJob, profile) {
    await delay(1800);

    if (query.includes("이력서") || query.includes("수정")) {
      return {
        responseText:
          "### 1. 직무 연관성이 높은 경험을 먼저 배치하세요\n현재 이력서에서는 인턴십 경험이 단순 성과 중심으로 보입니다. 이 공고 기준에서는 **병목 해결**, **성능 개선**, **트래픽 증가 대응 관점**이 더 앞에 보이는 편이 좋습니다.\n\n### 2. 정량 지표를 더 구체적으로 드러내세요\n응답 속도 개선, 쿼리 최적화, 장애 감소 같은 결과가 있다면 가능한 범위에서 수치와 맥락을 함께 보여주세요.\n\n### 3. 실무 확장 가능성을 한 줄로 보완하세요\n현재 경험이 대규모 분산 환경은 아니더라도, 같은 구조가 더 큰 트래픽에서 어떻게 확장될 수 있는지 설명하면 설득력이 올라갑니다.",
        evidence: [
          {
            type: "profile",
            title: "이력서 파싱 결과",
            snippet: "인턴십 중 API 응답 속도 개선 및 쿼리 최적화 경험 확인",
          },
          {
            type: "job",
            title: activeJob
              ? `${activeJob.company} 공고 요약`
              : "추천 공고 요구사항",
            snippet: activeJob
              ? activeJob.requirements[2]
              : "대규모 트래픽 처리 및 시스템 확장성 우대",
          },
        ],
      };
    }

    if (query.includes("메시지 큐") || query.includes("면접")) {
      return {
        responseText:
          "### 1. 메시지 큐 도입 기준을 먼저 설명하세요\n동기 호출보다 비동기 처리가 더 적절한 상황, 시스템 결합도를 낮춰야 하는 상황, 처리량을 늘려야 하는 상황을 기준으로 설명하면 좋습니다.\n\n### 2. 유실과 중복 처리에 대한 관점이 중요합니다\nAck, 재처리, 멱등성, Dead Letter Queue 같은 키워드를 함께 언급하면 분산 시스템에 대한 이해가 더 명확하게 드러납니다.\n\n### 3. 장점과 트레이드오프를 같이 말하세요\n확장성과 처리량 증가는 장점이지만, 시스템 복잡도와 추적 난이도 증가는 단점이라는 균형감을 보여주는 것이 좋습니다.",
        evidence: [
          {
            type: "market",
            title: "최근 기술 면접 경향",
            snippet: "비동기 아키텍처와 대규모 트래픽 대응 관점 검증 증가",
          },
          {
            type: "job",
            title: activeJob
              ? `${activeJob.company} 공고 우대사항`
              : "추천 공고 우대사항",
            snippet: "Kafka, Redis 등 분산 처리 경험 우대",
          },
        ],
      };
    }

    return {
      responseText:
        "### 1. 현재 상태 진단\n현재 프로필은 서버 개발의 기본기와 API 설계 역량이 분명한 편입니다. 다만 주요 추천 공고 다수가 요구하는 대규모 트래픽 및 분산 처리 경험은 보완 지점으로 남아 있습니다.\n\n### 2. 바로 적용 가능한 전략\n기존 경험을 단순 구현 경험이 아니라 **문제 정의 -> 병목 발견 -> 개선 -> 결과 측정**의 구조로 다시 정리해 보세요. 이 방식은 실무 연관성을 크게 높여줍니다.\n\n### 3. 다음 액션 제안\n특정 공고를 기준으로 이력서 문구를 재작성하거나, 부족한 역량만 따로 추려 단기 학습 계획으로 연결하는 것이 가장 효과적입니다.",
      evidence: [
        {
          type: "profile",
          title: "프로필 종합 분석",
          snippet: "서버 기본기는 강하나 분산 환경 실무 경험은 제한적",
        },
      ],
    };
  },
};

const Label = ({ children, className = "" }) => (
  <div
    className={`mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}
  >
    {children}
  </div>
);

const MetaTag = ({ icon: Icon, children }) => (
  <span className="mr-5 inline-flex items-center text-sm font-medium text-slate-600">
    <Icon size={15} className="mr-2 text-slate-400" />
    {children}
  </span>
);

const Panel = ({ children, className = "", noPadding = false }) => (
  <div
    className={`rounded-sm border border-slate-200 bg-white shadow-sm ${
      noPadding ? "" : "p-6"
    } ${className}`}
  >
    {children}
  </div>
);

function renderInlineBold(text, keyPrefix) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function StructuredResponse({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-base leading-loose text-slate-800">
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={`sp-${index}`} className="h-2" />;
        }
        if (line.startsWith("### ")) {
          return (
            <h3
              key={`h3-${index}`}
              className="border-b border-slate-100 pb-2 pt-4 text-xl font-bold text-slate-900"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={`ol-${index}`} className="ml-4 font-bold text-slate-900">
              {renderInlineBold(line, `ol-${index}`)}
            </div>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={`li-${index}`} className="ml-4 font-medium text-slate-700">
              {renderInlineBold(line.replace("- ", ""), `li-${index}`)}
            </div>
          );
        }
        return (
          <p key={`p-${index}`} className="font-medium text-slate-700">
            {renderInlineBold(line, `p-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

function lastModelMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "model") return messages[i];
  }
  return null;
}

const OnboardingView = ({ onNext }) => {
  const [fileUploaded, setFileUploaded] = useState(false);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 md:grid-cols-2">
      <div className="flex flex-col justify-center">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 text-white shadow-sm">
          <Database size={24} strokeWidth={1.5} />
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-slate-900">
          커리어 프로필 등록 및
          <br />
          분석 시작
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-600">
          입력하신 정보와 이력서를 바탕으로 최신 채용 공고와 시장 동향을
          교차 분석하여, 가장 적합한 방향성을 제시하는 개인화 리포트를
          생성합니다.
        </p>

        <div className="space-y-5 border-l-2 border-slate-200 pl-5">
          {[
            "이력서 파싱 및 핵심 역량 구조화",
            "적합 포지션 매칭 및 추천 근거 분석",
            "맞춤형 지원 전략 및 액션 플랜 도출",
          ].map((item) => (
            <div key={item} className="flex items-start">
              <CheckCircle
                size={18}
                className="mr-3 mt-0.5 flex-shrink-0 text-slate-400"
              />
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-sm border border-slate-200 bg-white p-10 shadow-sm">
        <div className="space-y-8">
          <div>
            <Label>이력서 / 포트폴리오 업로드</Label>
            {!fileUploaded ? (
              <button
                type="button"
                onClick={() => setFileUploaded(true)}
                className="group w-full rounded-sm border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100"
              >
                <UploadCloud className="mx-auto mb-3 h-7 w-7 text-slate-400 transition-colors group-hover:text-slate-700" />
                <p className="mb-1 text-sm font-bold text-slate-800">
                  파일을 여기로 드래그하거나 클릭하여 첨부하세요
                </p>
                <p className="text-xs font-medium text-slate-500">
                  PDF, Markdown, TXT 지원 (최대 10MB)
                </p>
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-sm border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                <div className="flex items-center">
                  <FileText size={20} className="mr-3 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Resume_v2_Backend.pdf
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      2.4 MB • 정상적으로 첨부됨
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFileUploaded(false)}
                  className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-slate-900"
                >
                  변경
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            <div>
              <Label>목표 직무</Label>
              <input
                type="text"
                defaultValue="Backend Engineer"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div>
              <Label>경력 수준</Label>
              <select className="w-full cursor-pointer border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-900">
                <option>신입 / 인턴십</option>
                <option>주니어 (1-3년)</option>
                <option>미들 (4-6년)</option>
                <option>시니어 (7년 이상)</option>
              </select>
            </div>
            <div>
              <Label>최종 학력</Label>
              <input
                type="text"
                defaultValue="컴퓨터공학과 학사"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div>
              <Label>선호 지역</Label>
              <input
                type="text"
                defaultValue="서울/판교"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div className="col-span-2">
              <Label>관심 산업 / 도메인</Label>
              <input
                type="text"
                defaultValue="금융, 플랫폼"
                className="w-full border-b border-slate-300 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
              />
            </div>
            <div className="col-span-2">
              <Label>추가 목표 / 고려 사항</Label>
              <textarea
                rows={3}
                defaultValue="대규모 트래픽 처리 경험을 빠르게 쌓을 수 있는 백엔드 직무를 우선 검토하고 싶습니다."
                className="w-full rounded-sm border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="flex w-full items-center justify-center rounded-sm bg-slate-900 py-4 text-sm font-bold tracking-wide text-white shadow-md transition-colors hover:bg-slate-800"
          >
            프로필 분석 및 리포트 생성하기
            <MoveRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ExtractionReviewView = ({ onNext }) => (
  <div className="mx-auto w-full max-w-3xl">
    <div className="mb-10">
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
        추출된 정보 검토
      </h1>
      <p className="text-lg text-slate-600">
        업로드하신 문서와 입력 정보에서 성공적으로 핵심 역량을 도출했습니다.
        이 데이터를 기반으로 맞춤형 리포트가 생성됩니다.
      </p>
    </div>

    <div className="mb-10 rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
        <div className="flex items-center text-sm font-bold text-slate-800">
          <Database size={16} className="mr-2 text-slate-500" />
          도출된 프로필 데이터 요약
        </div>
        <div className="rounded-sm border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
          분석 신뢰도: 매우 높음
        </div>
      </div>

      <div className="space-y-8 p-8">
        <div className="grid grid-cols-4 items-center gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0">목표 직무</Label>
          </div>
          <div className="col-span-2 text-lg font-bold text-slate-900">
            {MOCK_PROFILE.targetRole}
          </div>
          <div className="col-span-1 text-right">
            <button className="flex w-full items-center justify-end text-sm font-bold text-slate-500 hover:text-slate-900">
              <SlidersHorizontal size={14} className="mr-1.5" />
              수정
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0">경력 수준</Label>
          </div>
          <div className="col-span-3 text-base font-bold text-slate-800">
            {MOCK_PROFILE.experience}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4 border-b border-slate-100 pb-6">
          <div className="col-span-1">
            <Label className="mb-0 mt-1">식별된 보유 기술</Label>
          </div>
          <div className="col-span-3 flex flex-wrap gap-2">
            {MOCK_PROFILE.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-sm border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <div className="col-span-1">
            <Label className="mb-0 mt-1">도출된 핵심 강점</Label>
          </div>
          <div className="col-span-3 space-y-3">
            {MOCK_PROFILE.strengths.map((strength) => (
              <div
                key={strength}
                className="flex items-start text-base font-bold text-slate-800"
              >
                <CheckCircle
                  size={18}
                  className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
                />
                {strength}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-end space-x-4">
      <button className="rounded-sm border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
        프로필 내용 수정
      </button>
      <button
        onClick={onNext}
        className="flex items-center rounded-sm bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
      >
        확인 완료 및 기본 리포트 보기
        <MoveRight size={16} className="ml-2.5" />
      </button>
    </div>
  </div>
);

const BaselineReportView = ({ onJobClick, setView }) => (
  <div className="mx-auto max-w-6xl space-y-12 animate-in fade-in duration-700">
    <header className="mt-4 border-b border-slate-200 pb-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-sm border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm">
          기본 분석 리포트 // 2026.04.18 업데이트
        </div>
        <button className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900">
          <FileText size={16} className="mr-1.5" />
          리포트 저장
        </button>
      </div>
      <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
        현재 역량 기준, 최우선으로 검토해야 할{" "}
        <span className="text-indigo-600">추천 공고 3건</span>과 보완이 필요한{" "}
        <span className="text-amber-600">핵심 스킬 1가지</span>를
        확인했습니다.
      </h1>
    </header>

    <div className="flex flex-wrap items-center rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center">
          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-sm bg-slate-900 text-sm font-bold text-white shadow-sm">
            {MOCK_PROFILE.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {MOCK_PROFILE.targetRole}
            </div>
            <div className="mt-0.5 text-xs font-semibold text-slate-500">
              {MOCK_PROFILE.name} • {MOCK_PROFILE.experience}
            </div>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-slate-200 md:block" />
        <div className="hidden md:block">
          <Label className="mb-1">분석 기반 핵심 역량</Label>
          <div className="text-sm font-bold text-slate-800">
            {MOCK_PROFILE.skills.slice(0, 3).join(" • ")}
          </div>
        </div>
        <div className="hidden h-8 w-px bg-slate-200 md:block" />
        <div className="hidden md:block">
          <Label className="mb-1">목표 지역 및 도메인</Label>
          <div className="text-sm font-bold text-slate-800">
            {MOCK_PROFILE.location} / {MOCK_PROFILE.domain}
          </div>
        </div>
      </div>
      <button className="rounded-sm border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100">
        프로필 편집
      </button>
    </div>

    <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
      <div className="space-y-16 md:col-span-8">
        <section>
          <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              추천 공고 (상위 3건)
            </h2>
            <div className="text-sm font-bold text-slate-500">
              전체 34건 중 적합도 순 정렬
            </div>
          </div>

          <div className="space-y-6">
            {MOCK_OPPORTUNITIES.map((job) => (
              <div
                key={job.id}
                className="group cursor-pointer rounded-sm border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-600 hover:shadow-md"
                onClick={() => onJobClick(job)}
              >
                <div className="p-6 md:p-8">
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">
                          {job.company}
                        </span>
                        {job.status === "urgent" && (
                          <span className="rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm">
                            마감 임박
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                        {job.title}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <div className="text-3xl font-extrabold tracking-tighter text-slate-900">
                        {job.matchScore}
                        <span className="text-base font-bold text-slate-500">
                          점
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-500">
                        적합도 평가
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center">
                    <MetaTag icon={MapPin}>{job.location}</MetaTag>
                    <MetaTag icon={Clock}>
                      {job.deadline} ({job.urgency})
                    </MetaTag>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 md:px-8">
                  <div className="flex items-start">
                    <ShieldCheck
                      size={18}
                      className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
                    />
                    <div>
                      <span className="mr-2 text-sm font-bold text-slate-900">
                        이 공고가 추천된 이유:
                      </span>
                      <span className="text-sm font-medium leading-relaxed text-slate-700">
                        {job.matchReason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 border-b border-slate-200 pb-4 text-2xl font-bold tracking-tight text-slate-900">
            가장 먼저 해야 할 가이드
          </h2>
          <div className="rounded-sm bg-slate-900 p-8 text-white shadow-md">
            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="mr-4 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-indigo-500/20 text-sm font-bold text-indigo-400">
                  1
                </div>
                <div>
                  <p className="mb-2 text-lg font-bold text-white">
                    토스페이먼츠 지원을 위한 이력서 핵심 문장 재구성
                  </p>
                  <p className="mb-4 text-sm font-medium leading-relaxed text-slate-300">
                    기존 이력서의 인턴십 경험을 API 최적화 중심에서 트래픽
                    처리와 병목 해결 관점으로 수정하면 서류 설득력이 높아질 수
                    있습니다.
                  </p>
                  <button
                    onClick={() => setView("ask", MOCK_OPPORTUNITIES[0])}
                    className="flex items-center rounded-sm bg-white/10 px-4 py-2 text-sm font-bold text-indigo-300 transition-colors hover:text-white"
                  >
                    이력서 수정 방향 심층 분석하기
                    <MoveRight size={14} className="ml-2" />
                  </button>
                </div>
              </li>
              <li className="flex items-start border-t border-slate-700/50 pt-6">
                <div className="mr-4 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-slate-800 text-sm font-bold text-slate-400">
                  2
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    카카오뱅크 마감일정(D-7) 캘린더 확인 및 지원 준비
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="space-y-12 md:col-span-4">
        <Panel>
          <Label>최신 시장 수요 동향</Label>
          <div className="mt-4">
            <div className="mb-3 text-sm font-bold text-slate-900">
              현재 시장에서 가장 수요가 증가한 기술 (백엔드)
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-800 shadow-sm">
                Go ↑24%
              </span>
              <span className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-800 shadow-sm">
                Kubernetes ↑18%
              </span>
            </div>
            <p className="border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
              대규모 트래픽을 다루는 플랫폼 기업을 중심으로 MSA 아키텍처 및
              컨테이너 오케스트레이션 역량을 요구하는 비중이 상승하고
              있습니다.
            </p>
          </div>
        </Panel>

        <Panel>
          <Label>지원 판단 포인트 (Gap)</Label>
          <div className="mt-4 space-y-6">
            <div>
              <div className="mb-2 flex items-center text-sm font-bold text-slate-900">
                <Check size={16} className="mr-2 text-emerald-500" />
                강점으로 작용할 스킬
              </div>
              <div className="text-sm font-medium text-slate-700">
                Node.js, REST API 설계, RDBMS 모델링
              </div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                <AlertCircle size={16} className="mr-2 text-amber-500" />
                지금 보완하면 좋은 역량
              </div>
              <div className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 shadow-sm">
                대용량 트래픽 분산 처리 (Kafka, Redis)
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                서버 개발 기초는 탄탄하게 구축되어 있으나, 추천된 주요 포지션
                다수가 비동기 메시지 큐 시스템에 대한 이해도를 우대 조건으로
                명시하고 있습니다.
              </p>
            </div>
          </div>
        </Panel>

        <section>
          <Label className="mb-3">추가 심층 분석</Label>
          <div className="space-y-3">
            <button
              onClick={() => setView("ask", MOCK_OPPORTUNITIES[0])}
              className="flex w-full items-start rounded-sm border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-indigo-600"
            >
              <MessageSquare
                size={18}
                className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
              />
              <span>
                대용량 트래픽 처리 역량을 어필할 수 있는 최적의 면접 시나리오
                분석하기
              </span>
            </button>
            <button
              onClick={() => setView("ask", null)}
              className="flex w-full items-start rounded-sm border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-indigo-600"
            >
              <MessageSquare
                size={18}
                className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600"
              />
              <span>보완 역량 극복을 위한 4주 단기 학습 가이드 생성</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
);

const OpportunityDetailView = ({ job, onBack, setView }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenarios, setScenarios] = useState(null);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">
          선택된 공고가 없습니다
        </h2>
        <p className="mb-6 text-slate-600">
          먼저 기본 리포트에서 검토할 공고를 선택한 뒤 상세 화면으로
          이동해 주세요.
        </p>
        <button
          onClick={onBack}
          className="rounded-sm bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm"
        >
          기본 리포트로 돌아가기
        </button>
      </div>
    );
  }

  const handleGenerateScenario = async () => {
    setIsGenerating(true);
    try {
      const result = await MockAppService.generateInterviewScenarios(
        job,
        MOCK_PROFILE,
      );
      setScenarios(result);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          기본 리포트로 돌아가기
        </button>
        <div className="text-xs font-bold text-slate-400">
          공고 번호: JOB-{String(job.id).padStart(4, "0")}
        </div>
      </div>

      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <span className="text-base font-bold text-slate-900">
              {job.company}
            </span>
            <span className="rounded-sm border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm">
              추천 공고
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
            {job.title}
          </h1>
          <div className="mt-6 flex items-center gap-8 text-base font-bold text-slate-600">
            <MetaTag icon={MapPin}>{job.location}</MetaTag>
            <MetaTag icon={Clock}>
              마감: {job.deadline} ({job.urgency})
            </MetaTag>
            <MetaTag icon={FileCode}>정규직</MetaTag>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <button className="flex items-center rounded-sm border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            <Bookmark size={18} className="mr-2" />
            관심 공고 저장
          </button>
          <button className="flex items-center rounded-sm bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800">
            지원 준비 시작하기
            <ExternalLink size={16} className="ml-2" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-16 border-t border-slate-200 pt-12 md:grid-cols-12">
        <div className="space-y-12 md:col-span-8">
          <section className="rounded-sm border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <Label className="mb-4 text-slate-600">기업 및 도메인 컨텍스트</Label>
            <div className="space-y-5">
              <p className="text-base font-bold leading-relaxed text-slate-900">
                {job.companyContext?.description}
              </p>
              <div className="flex items-start rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
                <Lightbulb
                  size={20}
                  className="mr-4 mt-0.5 flex-shrink-0 text-amber-500"
                />
                <div>
                  <div className="mb-2 text-sm font-bold text-slate-900">
                    이 기업이 지금 유의미한 이유
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">
                    {job.companyContext?.whyRelevant}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">
              직무 요약
            </h3>
            <p className="text-lg font-bold leading-relaxed text-slate-800">
              {job.summary}
            </p>
          </section>

          <section>
            <h3 className="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-900">
              핵심 자격 요건
            </h3>
            <ul className="space-y-4">
              {job.requirements.map((req, index) => (
                <li
                  key={req}
                  className="flex items-start rounded-sm border border-slate-100 bg-white p-5 text-base text-slate-800 shadow-sm"
                >
                  <span className="mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <span className="mt-0.5 font-medium leading-relaxed">
                    {req}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-8 rounded-sm border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">
              지원 적합도 분석
            </h3>

            <div className="mb-8">
              <div className="flex items-baseline text-5xl font-extrabold tracking-tight text-slate-900">
                {job.matchScore}
                <span className="ml-1 text-lg font-bold text-slate-500">점</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${job.matchScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                  <CheckCircle size={18} className="mr-2 text-indigo-600" />
                  긍정적인 평가 요소
                </div>
                <p className="rounded-sm border border-indigo-100 bg-indigo-50/50 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                  {job.matchReason}
                </p>
              </div>
              <div>
                <div className="mb-3 flex items-center text-sm font-bold text-slate-900">
                  <AlertCircle size={18} className="mr-2 text-amber-600" />
                  지원 시 고려할 리스크
                </div>
                <p className="rounded-sm border border-amber-100 bg-amber-50/50 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm">
                  {job.gap}
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              {!scenarios ? (
                <button
                  onClick={handleGenerateScenario}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-center rounded-sm bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <Sparkles size={18} className="mr-2 text-indigo-300" />
                  )}
                  {isGenerating
                    ? "심층 분석을 진행 중입니다..."
                    : "이 포지션 면접 시나리오 분석하기"}
                </button>
              ) : (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="mb-4 flex items-center text-sm font-bold text-slate-900">
                    <Sparkles size={16} className="mr-2 text-indigo-600" />
                    도출된 면접 시나리오
                  </h3>
                  {scenarios.map((scen, index) => (
                    <div
                      key={`${scen.question}-${index}`}
                      className="rounded-sm border border-slate-200 bg-white p-5"
                    >
                      <p className="mb-4 text-sm font-bold leading-relaxed text-slate-900">
                        Q{index + 1}. {scen.question}
                      </p>
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <div>
                          <span className="mb-1 block text-xs font-bold text-slate-500">
                            면접관의 질문 의도
                          </span>
                          <span className="text-sm leading-relaxed text-slate-700">
                            {scen.reason}
                          </span>
                        </div>
                        <div className="rounded-sm border border-slate-100 bg-slate-50 p-3">
                          <span className="mb-1 block text-xs font-bold text-indigo-700">
                            추천 답변 프레임워크
                          </span>
                          <span className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-800">
                            {scen.framework}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setView("ask", job)}
                    className="mt-4 flex w-full items-center justify-center rounded-sm border border-slate-300 bg-white py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Search size={18} className="mr-2" />
                    이 공고를 워크스페이스에서 이어서 분석
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContextPanel = ({ job, profile }) => (
  <Panel>
    <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
      <Target size={16} className="mr-2 text-slate-500" />
      현재 분석 기준
    </h3>
    <div className="space-y-5">
      <div>
        <Label className="mb-1">기준 프로필</Label>
        <div className="flex items-center text-sm font-bold text-slate-800">
          {profile.targetRole}
          <span className="ml-2 font-semibold text-slate-500">
            ({profile.experience})
          </span>
        </div>
      </div>
      <div>
        <Label className="mb-1">분석 대상 공고</Label>
        {job ? (
          <div className="rounded-sm border border-indigo-100 bg-indigo-50 p-3 shadow-sm">
            <div className="mb-1 text-xs font-bold text-indigo-900">
              {job.company}
            </div>
            <div className="text-sm font-bold text-indigo-700">{job.title}</div>
          </div>
        ) : (
          <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-center text-sm font-bold text-slate-600">
            전체 프로필 기반 분석 (지정 공고 없음)
          </div>
        )}
      </div>
      <div>
        <Label className="mb-1">핵심 역량</Label>
        <div className="flex flex-wrap gap-2">
          {profile.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-sm border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Panel>
);

const EvidencePanel = ({ evidence }) => (
  <Panel className="flex flex-1 flex-col">
    <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
      <Database size={16} className="mr-2 text-slate-500" />
      현재 답변의 근거 자료
    </h3>
    <div className="custom-scrollbar max-h-[260px] flex-1 space-y-4 overflow-y-auto pr-2">
      {evidence && evidence.length > 0 ? (
        evidence.map((ev, index) => (
          <div
            key={`${ev.title}-${index}`}
            className="rounded-sm border border-slate-200 bg-slate-50 p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center">
              {ev.type === "profile" ? (
                <FileText size={14} className="mr-2 text-indigo-600" />
              ) : ev.type === "job" ? (
                <Briefcase size={14} className="mr-2 text-emerald-600" />
              ) : (
                <BarChart2 size={14} className="mr-2 text-amber-600" />
              )}
              <span className="text-xs font-bold text-slate-800">
                {ev.title}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-700">
              "{ev.snippet}"
            </p>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-sm font-medium text-slate-500">
          현재 답변에 명시적으로 연결된 문서 근거가 없습니다.
        </div>
      )}
    </div>
  </Panel>
);

const RelatedOpportunitiesPanel = ({ currentJob, allJobs, onOpenJob, onSwitch }) => {
  const relatedJobs = allJobs
    .filter((job) => !currentJob || job.id !== currentJob.id)
    .slice(0, 2);

  if (relatedJobs.length === 0) return null;

  return (
    <Panel>
      <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
        <GitMerge size={16} className="mr-2 text-slate-500" />
        연관 추천 공고 비교
      </h3>
      <div className="space-y-4">
        {relatedJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-400"
          >
            <div className="mb-2 flex items-start justify-between">
              <span className="text-xs font-bold text-slate-900">
                {job.company}
              </span>
              <span className="text-xs font-bold text-slate-500">
                적합도 {job.matchScore}
              </span>
            </div>
            <h4 className="mb-3 text-sm font-bold text-slate-800">
              {job.title}
            </h4>
            <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
              {job.matchReason}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenJob(job)}
                className="rounded-sm border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
              >
                상세 보기
              </button>
              <button
                onClick={() => onSwitch(job)}
                className="rounded-sm border border-indigo-200 bg-indigo-50 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                이 공고로 다시 분석
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const FollowUpPanel = ({ hasJob, onSelect }) => (
  <Panel>
    <h3 className="mb-4 flex items-center border-b border-slate-200 pb-3 text-sm font-bold text-slate-900">
      <FileQuestion size={16} className="mr-2 text-slate-500" />
      후속 분석 제안
    </h3>
    <ul className="space-y-3">
      {hasJob && (
        <li
          onClick={() =>
            onSelect(
              "이 공고의 핵심 요구사항에 맞춰 내 이력서의 어떤 부분을 수정하면 좋을지 구체적인 방향을 제시해 줘.",
            )
          }
          className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
        >
          <MoveRight
            size={16}
            className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
          />
          이 공고 기준으로 이력서 수정 방향 보기
        </li>
      )}
      <li
        onClick={() =>
          onSelect(
            "현재 내 프로필에서 부족한 역량이 무엇인지 정리하고, 이를 보완할 수 있는 학습 방향을 제시해 줘.",
          )
        }
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
      >
        <MoveRight
          size={16}
          className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
        />
        부족한 역량만 따로 심층 분석하기
      </li>
      <li
        onClick={() =>
          onSelect("추천 공고들의 마감일과 적합도를 함께 고려해서 우선순위를 다시 정리해 줘.")
        }
        className="group flex cursor-pointer items-start rounded-sm border border-slate-200 bg-white p-3.5 text-sm font-bold leading-relaxed text-slate-800 shadow-sm transition-colors hover:border-indigo-600 hover:shadow-md"
      >
        <MoveRight
          size={16}
          className="mr-3 mt-0.5 flex-shrink-0 text-indigo-600 opacity-70 transition-opacity group-hover:opacity-100"
        />
        마감일 기준으로 지원 우선순위 다시 보기
      </li>
    </ul>
  </Panel>
);

function seedAskMessages(activeJob) {
  const welcomeText = activeJob
    ? `**${activeJob.company}**의 **${activeJob.title}** 공고를 기준으로 심층 분석을 시작합니다. 이력서 최적화, 면접 준비, 역량 갭 분석처럼 필요한 방향을 요청해 주세요.`
    : "현재 전체 프로필을 기준으로 심층 분석 워크스페이스가 활성화되었습니다. 특정 공고를 선택하거나 전반적인 지원 전략에 대해 질문할 수 있습니다.";

  return [
    {
      role: "model",
      text: welcomeText,
      evidence: activeJob
        ? [
            {
              type: "job",
              title: `${activeJob.company} 공고 요약`,
              snippet: activeJob.summary,
            },
            {
              type: "profile",
              title: "기준 프로필",
              snippet: MOCK_PROFILE.skills.join(", "),
            },
          ]
        : [],
    },
  ];
}

const AskWorkspaceView = ({ activeJob, onContextChange, onOpenJob }) => {
  const [messages, setMessages] = useState(() => seedAskMessages(activeJob));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(seedAskMessages(activeJob));
  }, [activeJob]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const currentEvidence = useMemo(() => {
    const message = lastModelMessage(messages);
    return message?.evidence || [];
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const queryToUse = (overrideText || input).trim();
    if (!queryToUse || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: queryToUse }]);
    setInput("");
    setIsLoading(true);

    try {
      const { responseText, evidence } = await MockAppService.askWorkspace(
        queryToUse,
        activeJob,
        MOCK_PROFILE,
      );

      setMessages((prev) => [
        ...prev,
        { role: "model", text: responseText, evidence },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col gap-8 animate-in fade-in lg:flex-row">
      <div className="min-w-[600px] flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              메인 분석 패널
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              제시된 컨텍스트를 바탕으로 심층 분석 리포트를 생성합니다.
            </p>
          </div>
        </div>

        <div
          className="custom-scrollbar h-[calc(100%-150px)] overflow-y-auto bg-white p-10"
          ref={scrollRef}
        >
          <div className="mx-auto max-w-3xl space-y-12">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={
                  msg.role === "user"
                    ? "border-b border-slate-100 pb-10"
                    : "pb-6"
                }
              >
                {msg.role === "user" ? (
                  <div>
                    <Label className="mb-3 text-indigo-600">
                      분석 요청 사항
                    </Label>
                    <div className="whitespace-pre-wrap text-xl font-bold leading-relaxed text-slate-900">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="mb-4 text-slate-500">분석 결과 종합</Label>
                    <StructuredResponse text={msg.text} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="border-t border-slate-100 pt-4">
                <Label className="mb-4 flex items-center text-indigo-600">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  구조화된 답변을 생성하는 중입니다...
                </Label>
                <div className="max-w-2xl space-y-4">
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-4/6 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-6">
          <div className="relative mx-auto flex max-w-3xl items-center rounded-sm border border-slate-300 bg-white shadow-sm transition-all focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
            <div className="pl-4 text-slate-400">
              <Search size={20} />
            </div>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="연구 주제 또는 추가 분석 요청을 입력해 주세요..."
              className="custom-scrollbar h-14 w-full resize-none overflow-hidden bg-transparent py-4 pl-3 pr-16 text-sm font-bold text-slate-800 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 rounded-sm bg-slate-900 p-2 text-white transition-colors hover:bg-slate-800 disabled:opacity-30"
            >
              <MoveRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex w-[420px] flex-shrink-0 flex-col gap-6 overflow-y-auto pr-2 pb-8">
        <ContextPanel job={activeJob} profile={MOCK_PROFILE} />
        <EvidencePanel evidence={currentEvidence} />
        <RelatedOpportunitiesPanel
          currentJob={activeJob}
          allJobs={MOCK_OPPORTUNITIES}
          onOpenJob={(job) => onOpenJob(job)}
          onSwitch={(job) => onContextChange(job)}
        />
        <FollowUpPanel hasJob={!!activeJob} onSelect={handleSend} />
      </div>
    </div>
  );
};

const CalendarView = ({ onOpenJob }) => {
  const [viewMode, setViewMode] = useState("list");
  const daysInMonth = 30;
  const firstDayOffset = 3;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOffset }, (_, i) => i);
  const totalCells = days.length + blanks.length;
  const paddingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in fade-in">
      <header className="mt-4 flex items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            주요 채용 일정 관리
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            관심 공고와 추천 포지션의 다가오는 마감일을 확인하세요.
          </p>
        </div>
        <div className="flex rounded-sm border border-slate-200 bg-slate-100 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center px-4 py-2 transition-all ${
              viewMode === "list"
                ? "rounded-sm bg-white font-bold text-slate-900 shadow-sm"
                : "font-medium text-slate-500 hover:text-slate-700"
            }`}
          >
            <List size={16} className="mr-2" />
            <span className="text-sm">타임라인</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center px-4 py-2 transition-all ${
              viewMode === "calendar"
                ? "rounded-sm bg-white font-bold text-slate-900 shadow-sm"
                : "font-medium text-slate-500 hover:text-slate-700"
            }`}
          >
            <Grid size={16} className="mr-2" />
            <span className="text-sm">캘린더</span>
          </button>
        </div>
      </header>

      <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
        {viewMode === "list" ? (
          <div className="divide-y divide-slate-100">
            {[...MOCK_OPPORTUNITIES]
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map((job, index) => (
                <div
                  key={job.id}
                  className="group flex items-center p-8 transition-colors hover:bg-slate-50"
                >
                  <div className="mr-8 w-32 flex-shrink-0 border-r border-slate-200 pr-8 text-center">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      마감일
                    </div>
                    <div className="text-3xl font-extrabold tracking-tighter text-slate-900">
                      {job.deadline.split("-")[1]}/{job.deadline.split("-")[2]}
                    </div>
                    <div
                      className={`mt-2 inline-block rounded-sm px-2 py-0.5 text-xs font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.urgency}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold text-slate-900">
                      {job.company}
                    </h3>
                    <p className="text-base font-medium text-slate-600">
                      {job.title}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => onOpenJob(job)}
                      className="rounded-sm border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                2026. 04
              </h2>
              <div className="flex gap-2">
                <button className="rounded-sm border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <button className="rounded-sm border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className={`py-4 ${day === "Sun" ? "text-red-500" : ""}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px border-l border-slate-200 bg-slate-200">
              {blanks.map((blank) => (
                <div key={`blank-${blank}`} className="min-h-[160px] bg-slate-50 p-3" />
              ))}
              {days.map((day) => {
                const dateStr = `2026-04-${String(day).padStart(2, "0")}`;
                const jobs = MOCK_OPPORTUNITIES.filter(
                  (job) => job.deadline === dateStr,
                );
                const isToday = day === 18;
                return (
                  <div
                    key={day}
                    className="min-h-[160px] bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div
                      className={`mb-3 text-sm font-bold ${
                        isToday
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-2">
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => onOpenJob(job)}
                          className="w-full truncate rounded-sm border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-left text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300"
                        >
                          {job.company} 마감
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: paddingCells }).map((_, index) => (
                <div key={`pad-${index}`} className="min-h-[160px] bg-slate-50 p-3" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkspaceView = ({ onOpenAsk, onOpenJob }) => (
  <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-7xl flex-col space-y-8 animate-in fade-in">
    <header className="mt-4 flex flex-shrink-0 items-end justify-between border-b border-slate-200 pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          커리어 자산 및 노트
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          분석된 내용과 개인적인 조사 자료를 폴더 구조로 관리합니다.
        </p>
      </div>
      <div className="flex gap-3">
        <button className="rounded-sm bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800">
          새 문서 작성하기
        </button>
      </div>
    </header>

    <div className="mb-8 flex flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="flex w-80 flex-col border-r border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 p-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="문서 이름 검색..."
              className="w-full rounded-sm border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm transition-colors focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 select-none overflow-y-auto p-5">
          <Label className="mb-4 text-slate-500">내 드라이브</Label>

          <div className="space-y-2 text-sm font-medium text-slate-800">
            <div>
              <div className="group flex cursor-pointer items-center rounded-sm px-2 py-2.5 hover:bg-slate-200">
                <ChevronDown size={16} className="mr-2 text-slate-400" />
                <Folder
                  size={16}
                  className="mr-2 text-slate-500 group-hover:text-slate-700"
                />
                <span className="font-bold">01_지원_아카이브</span>
              </div>
              <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                <button
                  onClick={() => onOpenJob(MOCK_OPPORTUNITIES[0])}
                  className="flex w-full items-center rounded-sm bg-indigo-50 px-3 py-2 text-left font-bold text-indigo-700"
                >
                  <FileText size={14} className="mr-2" />
                  토스페이먼츠_JD분석.md
                </button>
                <button className="flex w-full items-center rounded-sm px-3 py-2 text-left text-slate-600 hover:bg-slate-100">
                  <FileText size={14} className="mr-2 text-slate-400" />
                  당근마켓_역량매핑.md
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="group flex cursor-pointer items-center rounded-sm px-2 py-2.5 hover:bg-slate-200">
                <ChevronRight size={16} className="mr-2 text-slate-400" />
                <Folder
                  size={16}
                  className="mr-2 text-slate-500 group-hover:text-slate-700"
                />
                <span className="font-bold">02_면접_준비자료</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="group flex cursor-pointer items-center rounded-sm px-2 py-2.5 hover:bg-slate-200">
                <ChevronDown size={16} className="mr-2 text-slate-400" />
                <Folder
                  size={16}
                  className="mr-2 text-slate-500 group-hover:text-slate-700"
                />
                <span className="font-bold">03_기술_개념정리</span>
              </div>
              <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                <button className="flex w-full items-center rounded-sm px-3 py-2 text-left text-slate-600 hover:bg-slate-100">
                  <FileText size={14} className="mr-2 text-slate-400" />
                  Kafka_메시지큐_구조.md
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-10 py-4 text-sm font-medium text-slate-500">
          내 드라이브 / 01_지원_아카이브 /
          <span className="ml-2 font-bold text-slate-900">
            토스페이먼츠_JD분석.md
          </span>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-12">
          <div className="max-w-3xl text-slate-800">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900">
              토스페이먼츠 코어 백엔드 분석
            </h1>

            <div className="mb-10 flex flex-wrap gap-3 border-b border-slate-200 pb-8">
              <span className="rounded-sm border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                상태: 진행 중
              </span>
              <span className="rounded-sm border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                도메인: 결제/금융
              </span>
            </div>

            <div className="prose prose-slate max-w-none">
              <h3 className="mt-8 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
                1. 직무 메타데이터 요약
              </h3>
              <p className="font-medium leading-relaxed text-slate-700">
                초당 수천 건의 트랜잭션을 무결성 있게 처리하는 시스템 설계.
                현재 프로필의 REST API 설계 경험과 Docker 환경 숙련도가 주요
                어필 포인트로 분석됩니다.
              </p>

              <h3 className="mt-10 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
                2. 스킬 갭 검증 및 전략
              </h3>
              <ul className="space-y-3">
                <li>
                  <strong>식별된 요구사항:</strong> 대용량 트래픽 처리 경험
                  (Kafka, Redis)
                </li>
                <li>
                  <strong>대응 로직:</strong> 인턴십 중 병목 현상 해결 경험을
                  기반으로, 캐싱 아키텍처 도입을 고민했던 점을 함께 정리하면
                  설득력이 높아집니다.
                </li>
              </ul>

              <div className="mt-12 rounded-sm border border-indigo-100 bg-indigo-50/30 p-6">
                <Label className="mb-3 flex items-center text-sm text-indigo-700">
                  <Zap size={16} className="mr-2" />
                  이어서 분석하기 좋은 질문
                </Label>
                <div className="rounded-sm border border-slate-200 bg-white p-4 text-sm font-medium leading-relaxed text-slate-800">
                  "이 공고 기준으로 이력서 문장을 어떤 순서로 재구성하면 더
                  설득력이 높아질지 분석해줘."
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => onOpenAsk(MOCK_OPPORTUNITIES[0])}
                    className="rounded-sm border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
                  >
                    심층 분석 워크스페이스에서 열기
                  </button>
                  <button
                    onClick={() => onOpenJob(MOCK_OPPORTUNITIES[0])}
                    className="rounded-sm border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    공고 상세 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function JobsWikiPrototype() {
  const [currentView, setCurrentView] = useState("onboarding");
  const [activeJobContext, setActiveJobContext] = useState(null);

  const navigateTo = (view, ...rest) => {
    if (rest.length > 0) {
      setActiveJobContext(rest[0] ?? null);
    }
    setCurrentView(view);
  };

  const openJobDetail = (job) => navigateTo("detail", job);
  const openAsk = (job = null) => navigateTo("ask", job);

  const renderMainContent = () => {
    switch (currentView) {
      case "report":
        return (
          <BaselineReportView onJobClick={openJobDetail} setView={navigateTo} />
        );
      case "detail":
        return (
          <OpportunityDetailView
            job={activeJobContext}
            onBack={() => navigateTo("report")}
            setView={navigateTo}
          />
        );
      case "ask":
        return (
          <AskWorkspaceView
            activeJob={activeJobContext}
            onContextChange={setActiveJobContext}
            onOpenJob={openJobDetail}
          />
        );
      case "calendar":
        return <CalendarView onOpenJob={openJobDetail} />;
      case "workspace":
        return <WorkspaceView onOpenAsk={openAsk} onOpenJob={openJobDetail} />;
      default:
        return (
          <BaselineReportView onJobClick={openJobDetail} setView={navigateTo} />
        );
    }
  };

  if (["onboarding", "extraction"].includes(currentView)) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
          <div className="flex items-center text-2xl font-bold tracking-tighter text-slate-900">
            <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm bg-slate-900 text-sm font-bold text-white">
              JW
            </span>
            Jobs-Wiki
            <span className="ml-4 border-l-2 border-slate-200 pl-4 text-base font-semibold text-slate-500">
              커리어 초기화
            </span>
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-81px)] items-center justify-center p-8 md:p-16">
          {currentView === "onboarding" && (
            <OnboardingView onNext={() => setCurrentView("extraction")} />
          )}
          {currentView === "extraction" && (
            <ExtractionReviewView onNext={() => setCurrentView("report")} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
        <div className="mb-4 border-b border-slate-800/50 px-6 py-8">
          <button
            onClick={() => navigateTo("report")}
            className="flex items-center text-2xl font-extrabold tracking-tighter text-white transition-colors hover:text-indigo-200"
          >
            <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-sm bg-indigo-600 text-xs font-bold text-white shadow-sm">
              JW
            </span>
            Jobs-Wiki
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          <div className="mb-3 mt-4 pl-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            분석 및 탐색
          </div>
          <button
            onClick={() => navigateTo("report")}
            className={`w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "report" || currentView === "detail"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <FileText size={18} className="mr-3 opacity-90" />
              기본 분석 리포트
            </span>
          </button>
          <button
            onClick={() => openAsk(activeJobContext)}
            className={`mb-8 w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "ask"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <Search size={18} className="mr-3 opacity-90" />
              심층 분석 워크스페이스
            </span>
          </button>

          <div className="mb-3 mt-8 pl-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            관리 및 저장
          </div>
          <button
            onClick={() => navigateTo("calendar")}
            className={`w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "calendar"
                ? "bg-slate-700 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <CalIcon size={18} className="mr-3 opacity-90" />
              지원 일정 관리
            </span>
          </button>
          <button
            onClick={() => navigateTo("workspace")}
            className={`w-full rounded-sm px-4 py-3 text-left text-sm font-bold transition-all ${
              currentView === "workspace"
                ? "bg-slate-700 text-white shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              <Folder size={18} className="mr-3 opacity-90" />
              커리어 자산 저장소
            </span>
          </button>
        </nav>

        <div className="cursor-pointer border-t border-slate-800/50 bg-slate-900/50 p-5 transition-colors hover:bg-slate-800">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
              {MOCK_PROFILE.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-white">{MOCK_PROFILE.name}</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                현재 워크스페이스
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-100/50">
        <div className="p-8 md:p-10 lg:p-12">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
}
