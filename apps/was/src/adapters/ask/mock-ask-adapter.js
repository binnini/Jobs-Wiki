import { askWorkspaceFixture } from "../../fixtures/ask.fixture.js"

function clone(value) {
  return structuredClone(value)
}

export function createMockAskAdapter() {
  return {
    async askWorkspace({ question, opportunityId }) {
      const fixture = clone(askWorkspaceFixture)

      if (opportunityId) {
        fixture.answer.markdown = `${fixture.answer.markdown}\n\nFocused opportunity: ${opportunityId}.`
      }

      fixture.answer.markdown = `${fixture.answer.markdown}\n\nQuestion: ${question}`

      return fixture
    },
  }
}
