import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const loadPack = async () =>
  JSON.parse(
    await readFile(resolve("packages/domain-packs/recruiting/v1.json"), "utf8"),
  );

test("recruiting pack v1 exposes the core recruiting entities and relations", async () => {
  const pack = await loadPack();

  assert.equal(pack.manifest.domain, "recruiting");
  assert.equal(pack.manifest.packVersion, "2026-04-18");
  assert.deepEqual(Object.keys(pack.entityTypes).sort(), ["company", "job_posting", "role"]);
  assert.deepEqual(Object.keys(pack.relationTypes).sort(), ["for_role", "posted_by"]);
});

test("recruiting pack v1 keeps deferred candidates as posting attributes", async () => {
  const pack = await loadPack();
  const postingAttributes = pack.entityTypes.job_posting.attributes;

  assert.ok(postingAttributes.location_text);
  assert.ok(postingAttributes.requirements_text);
  assert.ok(postingAttributes.selection_process_text);
  assert.equal(pack.entityTypes.location, undefined);
  assert.equal(pack.entityTypes.skill, undefined);
  assert.equal(pack.entityTypes.selection_step, undefined);
});

test("recruiting pack v1 defines identity hint fallback order for company and role", async () => {
  const pack = await loadPack();

  assert.deepEqual(
    pack.entityTypes.company.identity.strategies.map((strategy) => strategy.hint),
    ["external_id", "business_number", "normalized_name"],
  );
  assert.deepEqual(
    pack.entityTypes.role.identity.strategies.map((strategy) => strategy.hint),
    ["external_id", "normalized_name"],
  );
  assert.deepEqual(
    pack.entityTypes.job_posting.identity.strategies.map((strategy) => strategy.hint),
    ["source_id"],
  );
});
