# AGENTS.md

This file defines repository-specific guidance for coding agents working in this project.

## Project Identity

- This repository is a web-service-centered project.
- MCP server implementation does **not** belong in this repository.
- MCP-based clients are treated as **external consumers** of the WAS public API.
- Third-party integration code may live in this repo when it supports the WAS and ingestion stack.

## Repository Priorities

When making decisions, optimize in this order:

1. Preserve clean architectural boundaries
2. Keep official docs accurate and compact
3. Avoid coupling future WAS design too early
4. Keep third-party integration code reusable
5. Prefer explicit contracts over implicit assumptions

## Source of Truth

Read these first before making substantial changes:

- [README.md](/home/yebin/projects/Jobs-Wiki/README.md)
- [docs/README.md](/home/yebin/projects/Jobs-Wiki/docs/README.md)
- relevant files under `docs/architecture/`
- relevant files under `docs/api/`
- relevant files under `docs/domain/`

If the task is exploratory or spans multiple files, also read relevant notes in `dev-wiki/` if available.

## Docs vs Dev Wiki

### Official docs

`docs/` is for stable project documentation only.

Allowed content in `docs/`:

- product scope and vocabulary
- architecture and boundary definitions
- WAS/public API contracts
- domain model candidates and canonical concepts
- third-party reference material that is useful long-term

Do **not** put temporary development notes in `docs/`.

Official docs may include lightweight metadata that points to working notes, but only as background context.

Allowed front matter in `docs/`:

```md
---
status: draft
working_notes:
  - dev-wiki/architecture/2026-04-15-doc-boundary.md
---
```

Rules:

- use `working_notes`, not `depends_on`
- official docs must remain readable without opening `dev-wiki`
- do not add dev-wiki-to-dev-wiki dependency graphs in official docs

### Working notes

`dev-wiki/` is the working notebook for active development.

Use `dev-wiki/` for:

- architecture comparisons
- temporary decisions
- debugging trails
- experiment notes
- prompt drafts
- implementation checkpoints

Promotion rule:

- only move cleaned-up, stable conclusions from `dev-wiki/` into `docs/`
- do not copy working notes verbatim into official docs

## dev-wiki Rules

The repository uses this structure:

- `dev-wiki/architecture/`
- `dev-wiki/decisions/`
- `dev-wiki/experiments/`
- `dev-wiki/prompts/`

`dev-wiki/index.md` is intentionally minimal.

When adding a new working note:

- prefer date-prefixed kebab-case names
- keep the note short and decision-oriented
- optional front matter is allowed
- use `promotes_to` when the note is expected to feed official docs
- do **not** use `related_notes` between dev-wiki files
- use this template

```md
---
status: working
promotes_to:
  - docs/domain/jobs.md
---

# Title

## Context

## Current Question

## Observations

## Options

## Decision or Working Direction

## Open Questions

## Next Actions
```

Note:

- `dev-wiki/` is gitignored by project policy
- still write notes there when useful during development
- `dev-wiki` files should not build cross-note dependency chains
- if a note matters later, promote the cleaned-up conclusion into `docs/`

## Architecture Boundaries

### What belongs here

- `apps/frontend/`: frontend application
- `apps/was/`: serving/WAS-facing implementation
- `apps/ingestion/`: ingestion orchestration and durable source collection
- `packages/integrations/`: reusable third-party integrations
- `tests/`: executable tests, including smoke tests
- `docs/`: official design and project knowledge

### What does not belong here

- MCP server implementation
- external automation clients
- StrataWiki-owned DB schema or migration code
- one-off design scratch notes in `docs/`

If a task drifts toward “build the MCP server here”, stop and realign. This repo should only document MCP as an external consumer.

Serving and ingestion are also separate concerns.

- WAS serves public API traffic
- ingestion handles fetch, crawl, retry, schedule, backfill, and source persistence
- WAS does not perform ingestion work directly
- WAS may only trigger ingestion jobs through a narrow boundary when explicitly needed
- do not collapse ingestion orchestration into the WAS without explicit direction
- if a separate knowledge backend such as StrataWiki owns canonical storage, do not recreate or manage its DB internals in this repo

## WAS Contract Discipline

- Treat WAS-facing contracts as **draft** until the architecture is explicitly stabilized.
- Do not present current candidate contracts as final.
- Prefer names like “candidate”, “draft”, or “likely canonical” in docs when the design is not settled.
- Keep domain docs focused on concepts and source mapping, not on pretending the public API is already fixed.

## Third-Party Integration Rules

For WorkNet and similar sources:

- put reusable integration code under `packages/integrations/<service>/`
- keep official reference material under `docs/third-party/<service>/`
- record source oddities and unstable behavior in `docs/third-party/<service>/notes.md` if stable enough
- use `dev-wiki/` for temporary integration debugging notes
- design integrations so both WAS and ingestion can consume them

When external responses are inconsistent:

- absorb quirks in the integration layer
- do not leak raw third-party structure into higher-level contracts unless there is a strong reason

## Testing Expectations

Prefer layered validation:

- mapper/unit tests for deterministic parsing and transformation
- smoke tests for real third-party connectivity

Current relevant commands:

- `npm run test:worknet:mappers`
- `npm run test:worknet`

When changing WorkNet integration logic:

- update or add mapper tests first when possible
- rerun smoke tests if behavior or field mapping changed

## Editing Guidance

- Keep changes minimal and structurally consistent.
- Prefer extending existing files over inventing parallel structures.
- Avoid creating new top-level directories unless clearly justified.
- Use TypeScript for reusable package code when practical.
- Keep public naming cleaner than third-party source naming.

## Documentation Writing Style

When editing `docs/domain/*`:

- start with `Status`
- make it explicit when something is a draft or candidate
- include `Open Questions`
- separate canonical concepts from source mapping

When editing `docs/api/*`:

- do not lock down final endpoint contracts prematurely
- distinguish between outline/draft vs stable contract

When editing `docs/architecture/*`:

- focus on boundaries, responsibilities, and non-goals
- avoid implementation-level noise

## Escalation Heuristics

Pause and ask for clarification if:

- the task requires choosing a WAS architecture that has not been decided
- the change would collapse WAS and ingestion concerns together
- the change would introduce MCP implementation into this repo
- the change would turn draft contracts into final ones without explicit user direction

Otherwise, make the narrowest reasonable assumption and proceed.
