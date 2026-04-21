import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_DATABASE_URL =
  "postgresql://stratawiki:stratawiki@localhost:5432/stratawiki_jobswiki"

function loadRootEnv() {
  try {
    process.loadEnvFile?.(resolve(REPO_ROOT, ".env"))
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error
    }
  }
}

function summarize(value) {
  return JSON.stringify(value, null, 2)
}

function runPsql(connectionString, sql) {
  const result = spawnSync(
    "psql",
    [
      connectionString,
      "-X",
      "-q",
      "-t",
      "-A",
      "-F",
      "\t",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
    },
  )

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || "psql command failed")
  }

  return result.stdout.trim()
}

function parseCounts(output) {
  const [
    candidateRecords = "0",
    deletedRelations = "0",
    deletedRecords = "0",
    restoredSnapshotId = "",
  ] =
    output.split("\t")

  return {
    candidateRecords: Number.parseInt(candidateRecords, 10),
    deletedRelations: Number.parseInt(deletedRelations, 10),
    deletedRecords: Number.parseInt(deletedRecords, 10),
    restoredSnapshotId: restoredSnapshotId || null,
  }
}

async function main() {
  loadRootEnv()

  const databaseUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL
  const output = runPsql(
    databaseUrl,
    `
      WITH doomed_records AS (
        SELECT canonical_key
        FROM fact.record_envelopes
        WHERE domain = 'recruiting'
          AND scope = 'shared'
          AND (
            canonical_key IN ('job_posting:EMP-1', 'company:COMP-1', 'role:DEV-001')
            OR canonical_key LIKE 'job_posting:SMOKE-%'
            OR canonical_key LIKE 'company:SMOKE-%'
            OR canonical_key LIKE 'role:SMOKE-%'
            OR COALESCE(provenance_json::text, '') LIKE '%jobs-wiki-http-smoke-%'
          )
      ),
      deleted_relations AS (
        DELETE FROM fact.relation_envelopes
        WHERE domain = 'recruiting'
          AND (
            from_canonical_key IN (SELECT canonical_key FROM doomed_records)
            OR to_canonical_key IN (SELECT canonical_key FROM doomed_records)
            OR COALESCE(provenance_json::text, '') LIKE '%jobs-wiki-http-smoke-%'
          )
        RETURNING 1
      ),
      deleted_records AS (
        DELETE FROM fact.record_envelopes
        WHERE canonical_key IN (SELECT canonical_key FROM doomed_records)
        RETURNING 1
      ),
      fallback_snapshot AS (
        SELECT fact_snapshot_id
        FROM fact.record_envelopes
        WHERE domain = 'recruiting'
          AND scope = 'shared'
          AND entity_type = 'job_posting'
          AND canonical_key NOT LIKE 'job_posting:EMP-%'
          AND canonical_key NOT LIKE 'job_posting:SMOKE-%'
          AND COALESCE(provenance_json::text, '') NOT LIKE '%jobs-wiki-http-smoke-%'
        ORDER BY updated_at DESC
        LIMIT 1
      ),
      restored_pointer AS (
        UPDATE ops.snapshot_pointer
        SET current_snapshot_id = fallback_snapshot.fact_snapshot_id,
            fact_snapshot_id = fallback_snapshot.fact_snapshot_id,
            updated_at = NOW()
        FROM fallback_snapshot
        WHERE layer = 'fact'
          AND domain = 'recruiting'
        RETURNING fallback_snapshot.fact_snapshot_id
      )
      SELECT
        (SELECT count(*) FROM doomed_records),
        (SELECT count(*) FROM deleted_relations),
        (SELECT count(*) FROM deleted_records),
        COALESCE((SELECT fact_snapshot_id FROM restored_pointer LIMIT 1), '')
    `,
  )

  console.info(`[cleanup:http-smoke-facts] ${summarize(parseCounts(output))}`)
}

main().catch((error) => {
  console.error(`[cleanup:http-smoke-facts] failed: ${error.message}`)
  process.exitCode = 1
})
