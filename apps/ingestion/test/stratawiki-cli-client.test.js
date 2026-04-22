import test from "node:test"
import assert from "node:assert/strict"
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
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

test("validateStratawikiRuntime does not reject the fixed runtime sibling path", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "jobs-wiki-ingestion-test-"))
  const runtimeRoot = join(tempDir, "stratawiki-runtime")
  const wrapperPath = join(runtimeRoot, "bin", "stratawiki-jobswiki.sh")
  const packPath = join(tempDir, "recruiting-pack.json")

  await mkdir(join(runtimeRoot, "bin"), { recursive: true })
  await createExecutableFile(
    wrapperPath,
    "#!/usr/bin/env bash\nexit 0\n",
  )
  await writeFile(packPath, "{\"manifest\":{}}", "utf-8")

  await assert.doesNotReject(() =>
    validateStratawikiRuntime(
      {
        stratawikiCliWrapper: wrapperPath,
        stratawikiDomainPackPathsRaw: packPath,
        stratawikiDomainPackPaths: [packPath],
      },
      {
        expectedWrapperPath: wrapperPath,
      },
    ),
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
args=("$@")
cursor=0
seen_domain_pack_path=""
seen_active_pack=""
while [[ "$cursor" -lt "$#" ]]; do
  current="\${args[$cursor]}"
  if [[ "$current" == "--domain-pack-path" ]]; then
    cursor=$((cursor + 1))
    seen_domain_pack_path="\${args[$cursor]}"
  elif [[ "$current" == "--activate-domain-pack" ]]; then
    cursor=$((cursor + 1))
    seen_active_pack="\${args[$cursor]}"
  else
    break
  fi
  cursor=$((cursor + 1))
done

command_name="\${args[$cursor]}"
if [[ "$command_name" == "list-tools" ]]; then
  echo '[{"name":"validate_domain_proposal_batch"}]'
  exit 0
fi
if [[ "$command_name" == "call" ]]; then
  cursor=$((cursor + 1))
  tool="\${args[$cursor]}"
  cursor=$((cursor + 1))
  args_json='{}'
  while [[ "$cursor" -lt "$#" ]]; do
    current="\${args[$cursor]}"
    case "$current" in
      --args-file)
        cursor=$((cursor + 1))
        args_json="$(cat "\${args[$cursor]}")"
        cursor=$((cursor + 1))
        ;;
      --args)
        cursor=$((cursor + 1))
        args_json="\${args[$cursor]}"
        cursor=$((cursor + 1))
        ;;
      --envelope)
        cursor=$((cursor + 1))
        ;;
      *)
        cursor=$((cursor + 1))
        ;;
    esac
  done
  printf '{"tool":"%s","args":%s,"domainPackPath":"%s","activePack":"%s"}\\n' "$tool" "$args_json" "$seen_domain_pack_path" "$seen_active_pack"
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
      stratawikiActiveDomainPacksRaw: "recruiting=2026-04-22",
      stratawikiActiveDomainPacks: {
        recruiting: "2026-04-22",
      },
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
  assert.equal(response.domainPackPath, packPath)
  assert.equal(response.activePack, "recruiting=2026-04-22")

  const personalResponse = await client.callTool("query_personal_knowledge", {
    question: "How should I apply?",
  })
  assert.equal(personalResponse.args.save, false)

  await rm(tempDir, { recursive: true, force: true })
})
