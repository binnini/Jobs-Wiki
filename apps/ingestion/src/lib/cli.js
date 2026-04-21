function readFlag(args, flagName) {
  return args.includes(flagName)
}

function readOption(args, optionName) {
  const optionIndex = args.indexOf(optionName)

  if (optionIndex === -1) {
    return undefined
  }

  return args[optionIndex + 1]
}

function readPositiveIntegerOption(args, optionName) {
  const rawValue = readOption(args, optionName)

  if (rawValue === undefined) {
    return undefined
  }

  const parsed = Number.parseInt(String(rawValue).trim(), 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`)
  }

  return parsed
}

export function readCliOptions(args = process.argv.slice(2)) {
  if (readFlag(args, "--help") || readFlag(args, "-h")) {
    return {
      showHelp: true,
    }
  }

  const source = readOption(args, "--source")
  const mode = readOption(args, "--mode")
  const dryRunFlag = readFlag(args, "--dry-run")
  const applyFlag = readFlag(args, "--apply")
  const retryAttempts = readPositiveIntegerOption(args, "--retry-attempts")
  const retryDelayMs = readPositiveIntegerOption(args, "--retry-delay-ms")
  const page = readPositiveIntegerOption(args, "--page")
  const size = readPositiveIntegerOption(args, "--size")
  const backfillStartPage = readPositiveIntegerOption(args, "--backfill-start-page")
  const backfillPages = readPositiveIntegerOption(args, "--backfill-pages")
  const cycles = readPositiveIntegerOption(args, "--cycles")
  const maxPages = readPositiveIntegerOption(args, "--max-pages")
  const stateDir = readOption(args, "--state-dir")

  if (dryRunFlag && applyFlag) {
    throw new Error("Use only one of --dry-run or --apply.")
  }

  if (mode && !["manual", "scheduled", "backfill", "incremental"].includes(mode)) {
    throw new Error("--mode must be one of manual, scheduled, backfill, incremental.")
  }

  return {
    showHelp: false,
    source,
    mode,
    dryRun:
      dryRunFlag
        ? true
        : applyFlag
          ? false
          : undefined,
    retryAttempts,
    retryDelayMs,
    page,
    size,
    backfillStartPage,
    backfillPages,
    cycles,
    maxPages,
    stateDir,
  }
}

export function printHelp() {
  console.info(`Jobs-Wiki ingestion manual runner

Usage:
  npm run start:ingestion -- --source worknet --dry-run
  npm run ingest:worknet
  npm run ingest:worknet:apply
  npm run ingest:worknet:incremental
  npm run ingest:worknet:schedule
  npm run ingest:worknet:backfill

Options:
  --source <name>   Ingestion source family. Current baseline: worknet
  --mode <name>     manual | scheduled | backfill | incremental
  --dry-run         Use the execution contract without applying writes
  --apply           Mark the run as apply mode for future write integration
  --retry-attempts  Retry count for one ingestion unit
  --retry-delay-ms  Delay between retries in milliseconds
  --page <number>   Override WorkNet fetch page for one run
  --size <number>   Override WorkNet fetch size for one run
  --backfill-start-page <number>
                    First page to use in backfill mode
  --backfill-pages <number>
                    Number of sequential pages to ingest in backfill mode
  --cycles <number> Number of scheduled cycles before exit
  --max-pages <number>
                    Maximum pages to scan in incremental mode
  --state-dir <path>
                    Incremental state directory override
  --help            Show this help message
`)
}
