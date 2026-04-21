#!/bin/zsh
set -euo pipefail

REPO_ROOT="/Users/yebin/workSpace/Ontology/Jobs-Wiki"
LOG_DIR="${REPO_ROOT}/data/logs/ingestion"
TIMESTAMP="$(date '+%Y-%m-%dT%H-%M-%S')"

mkdir -p "${LOG_DIR}"

cd "${REPO_ROOT}"

export INGEST_DRY_RUN="${INGEST_DRY_RUN:-false}"
export INGEST_INCREMENTAL_MAX_PAGES="${INGEST_INCREMENTAL_MAX_PAGES:-3}"
export WORKNET_FETCH_SIZE="${WORKNET_FETCH_SIZE:-20}"

{
  echo "[worknet-daily-batch] started_at=$(date '+%Y-%m-%dT%H:%M:%S%z')"
  echo "[worknet-daily-batch] repo_root=${REPO_ROOT}"
  echo "[worknet-daily-batch] incremental_max_pages=${INGEST_INCREMENTAL_MAX_PAGES}"
  echo "[worknet-daily-batch] fetch_size=${WORKNET_FETCH_SIZE}"
  npm run ingest:worknet:incremental
  echo "[worknet-daily-batch] finished_at=$(date '+%Y-%m-%dT%H:%M:%S%z')"
} >> "${LOG_DIR}/worknet-daily-batch-${TIMESTAMP}.log" 2>&1
