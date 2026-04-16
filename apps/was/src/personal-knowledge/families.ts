import type {
  AnswerGenerationInputBundle,
  GeneratedPersonalPage,
  PersonalFamilyDefinition,
  PersonalFamilyKey,
} from "./types.ts";

export const DEFAULT_PERSONAL_FAMILY_SET: PersonalFamilyKey[] = [
  "personal.workspace_briefing",
  "personal.application_next_steps",
];

export const PERSONAL_FAMILIES: Record<PersonalFamilyKey, PersonalFamilyDefinition> = {
  "personal.workspace_briefing": {
    familyKey: "personal.workspace_briefing",
    label: "Workspace Briefing",
    description: "질문에 바로 답하기 위한 짧은 개인 브리핑 페이지입니다.",
    generate: generateWorkspaceBriefing,
  },
  "personal.application_next_steps": {
    familyKey: "personal.application_next_steps",
    label: "Application Next Steps",
    description: "질문 기준으로 다음 액션과 확인 포인트를 정리하는 페이지입니다.",
    generate: generateApplicationNextSteps,
  },
  "personal.evidence_map": {
    familyKey: "personal.evidence_map",
    label: "Evidence Map",
    description: "질문에 연결된 page, object, relation anchor를 한 번에 정리하는 페이지입니다.",
    generate: generateEvidenceMap,
  },
};

export function generatePersonalPages(
  bundle: AnswerGenerationInputBundle,
  familyKeys: PersonalFamilyKey[],
): GeneratedPersonalPage[] {
  return familyKeys.map((familyKey) => PERSONAL_FAMILIES[familyKey].generate(bundle));
}

function generateWorkspaceBriefing(
  bundle: AnswerGenerationInputBundle,
): GeneratedPersonalPage {
  const top = bundle.contextBlocks[0];
  const evidence = bundle.contextBlocks
    .map(
      (block, index) =>
        `${index + 1}. **${block.title}** (${block.familyKey})\n   - ${block.summary}\n   - 이유: ${block.whyIncluded}`,
    )
    .join("\n");

  const bodyMarkdown = [
    `# Workspace Briefing`,
    ``,
    `질문: ${bundle.query}`,
    ``,
    `## Short Answer`,
    top
      ? `${top.title}를 우선 읽는 것이 가장 직접적입니다. 현재 retrieval 상위 문맥은 ${bundle.answerIntent.matchedTerms.join(", ") || "질문 핵심"}에 집중되어 있습니다.`
      : `현재 질문과 직접 맞는 personal page를 찾지 못했습니다.`,
    ``,
    `## Evidence`,
    evidence || `- 선택된 근거 페이지가 없습니다.`,
    ``,
    `## Retrieval Notes`,
    `- ranking version: ${bundle.retrieval.rankingVersion}`,
    `- selected context blocks: ${bundle.contextBlocks.length}`,
    `- omitted candidates: ${bundle.retrieval.omittedCandidateCount}`,
    `- canonical evidence blocks: ${bundle.canonicalEvidence.length}`,
    `- relation context blocks: ${bundle.relationContextBlocks.length}`,
  ].join("\n");

  return {
    pageRef: {
      pageId: "workspace-briefing",
      familyKey: "personal.workspace_briefing",
    },
    title: "Workspace Briefing",
    summary: top?.summary ?? "질문에 대한 직접 답변을 위한 개인 브리핑",
    bodyMarkdown,
    generatedAt: bundle.assembledAt,
    sourcePageRefs: bundle.contextBlocks.map((block) => block.pageRef),
    generationMode: "persisted",
  };
}

function generateApplicationNextSteps(
  bundle: AnswerGenerationInputBundle,
): GeneratedPersonalPage {
  const actionItems = bundle.contextBlocks
    .slice(0, 3)
    .map((block, index) => {
      const firstSentence = block.excerpt || block.summary;
      return `${index + 1}. **${block.title}**\n   - 확인할 내용: ${firstSentence}\n   - 선택 이유: ${block.whyIncluded}`;
    })
    .join("\n");

  const followUps = bundle.answerIntent.matchedTerms.length
    ? bundle.answerIntent.matchedTerms
        .map((term) => `- \`${term}\` 기준으로 관련 object/relation을 더 좁혀 읽기`)
        .join("\n")
    : "- 추가 질의어 없이 broad personal scan 유지";

  const bodyMarkdown = [
    `# Application Next Steps`,
    ``,
    `질문: ${bundle.query}`,
    ``,
    `## Next Actions`,
    actionItems || `- retrieval 결과가 부족하여 후속 액션을 만들지 못했습니다.`,
    ``,
    `## Follow-up Query Suggestions`,
    followUps,
    ``,
    `## Source Pages`,
    ...bundle.contextBlocks.map((block) => `- ${block.title} (${block.familyKey})`),
    ``,
    `## Citation Anchors`,
    ...bundle.citationSummary.objectRefs.map(
      (objectRef) => `- object: ${objectRef.objectKind}:${objectRef.objectId}`,
    ),
    ...bundle.citationSummary.relationRefs.map(
      (relationRef) => `- relation: ${relationRef.relationType ?? "related"}:${relationRef.relationId}`,
    ),
    ``,
    `## Canonical Evidence`,
    ...(bundle.canonicalEvidence.length > 0
      ? bundle.canonicalEvidence.map(
          (entry) =>
            `- ${entry.objectRef.objectKind}:${entry.objectRef.objectId} - ${entry.summary}`,
        )
      : ["- canonical evidence not included"]),
    ``,
    `## Relation Context`,
    ...(bundle.relationContextBlocks.length > 0
      ? bundle.relationContextBlocks.map(
          (block) =>
            `- ${block.relationRef.relationType ?? "related"}:${block.relationRef.relationId} - ${block.summary}`,
        )
      : ["- relation context not included"]),
  ].join("\n");

  return {
    pageRef: {
      pageId: "application-next-steps",
      familyKey: "personal.application_next_steps",
    },
    title: "Application Next Steps",
    summary: "질문 기준 다음 액션과 확인 포인트",
    bodyMarkdown,
    generatedAt: bundle.assembledAt,
    sourcePageRefs: bundle.contextBlocks.map((block) => block.pageRef),
    generationMode: "persisted",
  };
}

function generateEvidenceMap(
  bundle: AnswerGenerationInputBundle,
): GeneratedPersonalPage {
  const contextLines = bundle.contextBlocks.length > 0
    ? bundle.contextBlocks.map(
        (block) =>
          `- ${block.title} (${block.familyKey}) -> ${block.objectRef ? `${block.objectRef.objectKind}:${block.objectRef.objectId}` : "no object anchor"}`,
      )
    : ["- selected context block 없음"];
  const objectLines = bundle.citationSummary.objectRefs.length > 0
    ? bundle.citationSummary.objectRefs.map(
        (objectRef) => `- ${objectRef.objectKind}:${objectRef.objectId}${objectRef.title ? ` - ${objectRef.title}` : ""}`,
      )
    : ["- object anchor 없음"];
  const relationLines = bundle.relationContextBlocks.length > 0
    ? bundle.relationContextBlocks.map(
        (block) =>
          `- ${block.relationRef.relationType ?? "related"}:${block.relationRef.relationId} - ${block.neighborhoodSummary ?? block.summary}`,
      )
    : ["- relation context 없음"];
  const canonicalLines = bundle.canonicalEvidence.length > 0
    ? bundle.canonicalEvidence.map(
        (entry) =>
          `- ${entry.objectRef.objectKind}:${entry.objectRef.objectId} - ${entry.summary}`,
      )
    : ["- canonical evidence not included"];

  return {
    pageRef: {
      pageId: "evidence-map",
      familyKey: "personal.evidence_map",
    },
    title: "Evidence Map",
    summary: "질문에 연결된 page, object, relation 근거 맵",
    bodyMarkdown: [
      `# Evidence Map`,
      ``,
      `질문: ${bundle.query}`,
      ``,
      `## Context Blocks`,
      ...contextLines,
      ``,
      `## Object Anchors`,
      ...objectLines,
      ``,
      `## Relation Neighborhoods`,
      ...relationLines,
      ``,
      `## Canonical Evidence`,
      ...canonicalLines,
    ].join("\n"),
    generatedAt: bundle.assembledAt,
    sourcePageRefs: bundle.contextBlocks.map((block) => block.pageRef),
    generationMode: "persisted",
  };
}
