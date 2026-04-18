import test from "node:test"
import assert from "node:assert/strict"
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  createStratawikiCliClient,
  validateStratawikiRuntime,
} from "../src/clients/stratawiki-cli-client.js"

async function createExecutableFile(pathText, contents) {
  await writeFile(pathText, contents, "utf-8")
  await chmod(pathText, 0o755)
}

test("validateStratawikiRuntime rejects missing domain pack configuration", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-ingestion-test-"))
  const wrapperPath = join(tempDir, "stratawiki-jobswiki.sh")

  await createExecutableFile(
    wrapperPath,
    "#!/usr/bin/env bash\nexit 0\n",
  )

  await assert.rejects(
    () =>
      validateStratawikiRuntime(
        {
          stratawikiCliWrapper: wrapperPath,
          stratawikiDomainPackPathsRaw: "",
          stratawikiDomainPackPaths: [],
        },
        {
          expectedWrapperPath: wrapperPath,
        },
      ),
    /JOBS_WIKI_STRATAWIKI_DOMAIN_PACK_PATHS/,
  )

  await rm(tempDir, { recursive: true, force: true })
})

test("createStratawikiCliClient uses wrapper with args-file transport", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-ingestion-test-"))
  const wrapperPath = join(tempDir, "stratawiki-jobswiki.sh")
  const packPath = join(tempDir, "recruiting-pack.json")

  await writeFile(packPath, "{\"manifest\":{}}", "utf-8")
  await createExecutableFile(
    wrapperPath,
    `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "list-tools" ]]; then
  echo '[{"name":"validate_domain_proposal_batch"}]'
  exit 0
fi
if [[ "$1" == "call" ]]; then
  tool="$2"
  shift 2
  args_json='{}'
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --args-file)
        args_json="$(cat "$2")"
        shift 2
        ;;
      --args)
        args_json="$2"
        shift 2
        ;;
      --envelope)
        shift
        ;;
      *)
        shift
        ;;
    esac
  done
  printf '{"tool":"%s","args":%s}\\n' "$tool" "$args_json"
  exit 0
fi
echo '{"ok":false}'
`,
  )

  const client = createStratawikiCliClient(
    {
      stratawikiCliWrapper: wrapperPath,
      stratawikiDomainPackPathsRaw: packPath,
      stratawikiDomainPackPaths: [packPath],
      stratawikiActiveDomainPacksRaw: "recruiting=2026-04-18",
      stratawikiConfigured: true,
    },
    {
      expectedWrapperPath: wrapperPath,
    },
  )

  const tools = await client.listTools()
  assert.equal(tools[0].name, "validate_domain_proposal_batch")

  const response = await client.callTool("validate_domain_proposal_batch", {
    batch: {
      batch_id: "batch-1",
    },
  })

  assert.equal(response.tool, "validate_domain_proposal_batch")
  assert.equal(response.args.batch.batch_id, "batch-1")

  const personalResponse = await client.callTool("query_personal_knowledge", {
    question: "How should I apply?",
  })
  assert.equal(personalResponse.args.save, false)

  await rm(tempDir, { recursive: true, force: true })
})
