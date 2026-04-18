import { createNotFoundError } from "../../http/errors.js"
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

export function createMockAskAdapter() {
  return {
    async askWorkspace({ question, opportunityId }) {
      const fixture = opportunityId
        ? buildContextualAskFixture(opportunityId)
        : clone(askWorkspaceFixture)

      fixture.answer.markdown = `${fixture.answer.markdown}\n\nQuestion: ${question}`

      return fixture
    },
  }
}
