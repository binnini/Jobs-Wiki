import { createNotFoundError } from "../../http/errors.js"
import { documentDetailsFixture } from "../../fixtures/document-detail.fixture.js"
import { askWorkspaceFixture } from "../../fixtures/ask.fixture.js"
import {
  opportunityDetailsFixture,
  opportunityListFixture,
} from "../../fixtures/opportunities.fixture.js"

function clone(value) {
  return structuredClone(value)
}

function buildContextualAskFixture(opportunityId) {
  const opportunity = opportunityDetailsFixture[opportunityId]

  if (!opportunity) {
    throw createNotFoundError("opportunity not found", {
      opportunityId,
    })
  }

  const fixture = clone(askWorkspaceFixture)

  fixture.answer.markdown = [
    `### Focused fit for ${opportunity.title}`,
    opportunity.analysis?.strengthsSummary ?? opportunity.summary,
    fixture.answer.markdown,
  ].join("\n\n")
  fixture.activeContext = {
    contextType: "opportunity",
    title: opportunity.title,
    opportunityId,
  }
  fixture.evidence = [...fixture.evidence, ...(opportunity.evidence ?? [])]
  fixture.relatedOpportunities = opportunityListFixture.filter(
    (item) => item.opportunityId !== opportunityId,
  )
  fixture.relatedDocuments = [
    ...fixture.relatedDocuments,
    ...(opportunity.relatedDocuments ?? []),
  ]

  return fixture
}

function buildDocumentContextualAskFixture(documentId) {
  const document = documentDetailsFixture[documentId]

  if (!document) {
    throw createNotFoundError("document not found", {
      documentId,
    })
  }

  const fixture = clone(askWorkspaceFixture)

  fixture.answer.markdown = [
    `### Document focus for ${document.title}`,
    document.summary ?? "현재 문서 surface를 기준으로 질문을 정리합니다.",
    fixture.answer.markdown,
  ].join("\n\n")
  fixture.activeContext = {
    contextType: "document",
    title: document.title,
    documentId,
    layer: document.layer,
  }
  fixture.relatedDocuments = [
    {
      documentObjectId: document.documentId,
      documentObjectKind: "document",
      documentTitle: document.title,
      role: document.layer,
      excerpt: document.summary,
    },
    ...fixture.relatedDocuments,
  ]

  return fixture
}

export function createMockAskAdapter() {
  return {
    async askWorkspace({ question, opportunityId, documentId }) {
      const fixture = documentId
        ? buildDocumentContextualAskFixture(documentId)
        : opportunityId
          ? buildContextualAskFixture(opportunityId)
          : clone(askWorkspaceFixture)

      fixture.answer.markdown = `${fixture.answer.markdown}\n\nQuestion: ${question}`

      return fixture
    },
  }
}
