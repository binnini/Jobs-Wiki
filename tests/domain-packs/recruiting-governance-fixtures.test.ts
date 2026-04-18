import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mapRecruitingSourceToDomainProposalBatch } from "../../packages/domain-packs/recruiting/mapper.ts";
import type { DomainProposalBatch } from "../../packages/domain-packs/recruiting/mapper.ts";
import type { RecruitingSourcePayload } from "../../packages/integrations/worknet/src/recruiting.ts";

type FixtureCoverage =
  | "normal"
  | "job_posting"
  | "company"
  | "role"
  | "relations"
  | "missing_data"
  | "company_missing"
  | "role_missing"
  | "relation_omission"
  | "ambiguous_signal"
  | "noisy_signal"
  | "fallback_identity"
  | "deduplication"
  | "invalid"
  | "missing_required_attribute"
  | "unknown_attribute";

type MappedSourceFixture = {
  id: string;
  kind: "mapped_source";
  sourceProfile: string;
  description: string;
  sourcePayloadFile: string;
  proposalBatchFile: string;
  coverage: FixtureCoverage[];
};

type InvalidProposalFixture = {
  id: string;
  kind: "invalid_proposal";
  sourceProfile: string;
  description: string;
  proposalBatchFile: string;
  coverage: FixtureCoverage[];
  expectedInvalidReasons: string[];
};

type RecruitingFixtureCatalog = {
  schemaVersion: string;
  domain: string;
  packVersion: string;
  fixtures: Array<MappedSourceFixture | InvalidProposalFixture>;
};

type RecruitingPack = {
  manifest: {
    domain: string;
    packVersion: string;
  };
  entityTypes: Record<
    string,
    {
      attributes: Record<string, unknown>;
      requiredAttributes: string[];
    }
  >;
};

async function loadJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

async function loadFixtureFile<T>(fileName: string): Promise<T> {
  return loadJsonFile(`tests/domain-packs/fixtures/${fileName}`);
}

function collectPackInvalidReasons(
  batch: DomainProposalBatch,
  pack: RecruitingPack,
): string[] {
  const reasons: string[] = [];

  for (const fact of batch.facts) {
    const entityDefinition = pack.entityTypes[fact.entityType];
    if (!entityDefinition) {
      reasons.push(`facts.${fact.proposalId}.unknown_entity_type:${fact.entityType}`);
      continue;
    }

    for (const requiredAttribute of entityDefinition.requiredAttributes) {
      if (!(requiredAttribute in fact.attributes)) {
        reasons.push(
          `facts.${fact.proposalId}.missing_required_attribute:${requiredAttribute}`,
        );
      }
    }

    for (const attributeName of Object.keys(fact.attributes)) {
      if (!(attributeName in entityDefinition.attributes)) {
        reasons.push(`facts.${fact.proposalId}.unknown_attribute:${attributeName}`);
      }
    }
  }

  return reasons;
}

const fixtureCatalog = await loadFixtureFile<RecruitingFixtureCatalog>(
  "recruiting-golden-fixtures.json",
);
const recruitingPack = await loadJsonFile<RecruitingPack>(
  "packages/domain-packs/recruiting/v1.json",
);

test("fixture catalog covers the core governance scenarios for recruiting", () => {
  const fixtureIds = new Set(fixtureCatalog.fixtures.map((fixture) => fixture.id));

  assert.equal(fixtureCatalog.schemaVersion, "recruiting-governance-fixtures/v1");
  assert.equal(fixtureCatalog.domain, recruitingPack.manifest.domain);
  assert.equal(fixtureCatalog.packVersion, recruitingPack.manifest.packVersion);
  assert.ok(fixtureIds.has("worknet_open_recruitment_normal"));
  assert.ok(fixtureIds.has("worknet_open_recruitment_missing_company"));
  assert.ok(fixtureIds.has("worknet_open_recruitment_missing_role"));
  assert.ok(fixtureIds.has("worknet_open_recruitment_ambiguous_noisy"));
  assert.ok(fixtureIds.has("recruiting_invalid_missing_title_and_unknown_attribute"));
});

for (const fixture of fixtureCatalog.fixtures) {
  if (fixture.kind !== "mapped_source") continue;

  test(`mapped fixture ${fixture.id} stays aligned with the current mapper output`, async () => {
    const payload = await loadFixtureFile<RecruitingSourcePayload>(fixture.sourcePayloadFile);
    const expected = await loadFixtureFile<DomainProposalBatch>(fixture.proposalBatchFile);

    const actual = mapRecruitingSourceToDomainProposalBatch(payload);

    assert.deepEqual(actual, expected);
  });
}

test("invalid proposal fixture documents pack-level invalid reasons for future dry-run reuse", async () => {
  const fixture = fixtureCatalog.fixtures.find(
    (entry): entry is InvalidProposalFixture => entry.kind === "invalid_proposal",
  );

  assert.ok(fixture);

  const batch = await loadFixtureFile<DomainProposalBatch>(fixture.proposalBatchFile);
  const reasons = collectPackInvalidReasons(batch, recruitingPack);

  assert.deepEqual(reasons, fixture.expectedInvalidReasons);
});
