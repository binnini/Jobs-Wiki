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

export function readCliOptions(args = process.argv.slice(2)) {
  if (readFlag(args, "--help") || readFlag(args, "-h")) {
    return {
      showHelp: true,
    }
  }

  const source = readOption(args, "--source")
  const dryRunFlag = readFlag(args, "--dry-run")
  const applyFlag = readFlag(args, "--apply")

  if (dryRunFlag && applyFlag) {
    throw new Error("Use only one of --dry-run or --apply.")
  }

  return {
    showHelp: false,
    source,
    dryRun:
      dryRunFlag
        ? true
        : applyFlag
          ? false
          : undefined,
  }
}

export function printHelp() {
  console.info(`Jobs-Wiki ingestion manual runner

Usage:
  npm run start:ingestion -- --source worknet --dry-run
  npm run ingest:worknet
  npm run ingest:worknet:apply

Options:
  --source <name>   Ingestion source family. Current baseline: worknet
  --dry-run         Use the execution contract without applying writes
  --apply           Mark the run as apply mode for future write integration
  --help            Show this help message
`)
}
