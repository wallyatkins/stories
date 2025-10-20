#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

REMOTE_DONE_SUFFIX="${REMOTE_DONE_SUFFIX:-.done}"
FFMPEG_BIN="${FFMPEG_BIN:-ffmpeg}"
RSYNC_BIN="${RSYNC_BIN:-rsync}"
SSH_BIN="${SSH_BIN:-ssh}"
CURL_BIN="${CURL_BIN:-curl}"
PRESERVE_ORIGINALS="${PRESERVE_ORIGINALS:-true}"
UPLOAD_DERIVATIVES="${UPLOAD_DERIVATIVES:-true}"
LOG_LEVEL="${LOG_LEVEL:-info}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-}"
LOCAL_ROOT="${LOCAL_ROOT:-$SCRIPT_DIR}"
LOCAL_INBOX="${LOCAL_INBOX:-$LOCAL_ROOT/inbox}"
LOCAL_OUTPUT="${LOCAL_OUTPUT:-$LOCAL_ROOT/output}"
LOCAL_ARCHIVE="${LOCAL_ARCHIVE:-$LOCAL_ROOT/archive}"
LOCAL_FAILED="${LOCAL_FAILED:-$LOCAL_ROOT/failed}"
LOCAL_STATE_DIR="${LOCAL_STATE_DIR:-$LOCAL_ROOT/state}"
LOCAL_LOG_DIR="${LOCAL_LOG_DIR:-$LOCAL_ROOT/logs}"

PIPELINE_API_URL="${PIPELINE_API_URL:-}"
PIPELINE_API_TOKEN="${PIPELINE_API_TOKEN:-}"

DRY_RUN=false
NO_SYNC=false

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --dry-run        Print actions without executing file mutations
  --no-upload      Skip pushing transcoded files back to the server
  --no-sync        Process existing local inbox without rsync
  --help           Show this message
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    --no-upload)
      UPLOAD_DERIVATIVES=false
      ;;
    --no-sync)
      NO_SYNC=true
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

assert_binary() {
  local bin="$1"
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Required binary not found in PATH: $bin" >&2
    exit 1
  fi
}

require_var REMOTE_SSH
require_var REMOTE_UPLOAD_ROOT
if [[ "$UPLOAD_DERIVATIVES" == true ]]; then
  require_var REMOTE_PROCESSED_ROOT
fi

assert_binary "$FFMPEG_BIN"
assert_binary "$RSYNC_BIN"
assert_binary "$SSH_BIN"
if [[ -n "$PIPELINE_API_URL" ]]; then
  assert_binary "$CURL_BIN"
fi

log_priority() {
  case "$1" in
    error) echo 0 ;;
    warn) echo 1 ;;
    info) echo 2 ;;
    debug) echo 3 ;;
    *) echo 2 ;;
  esac
}

should_log() {
  local target="$(log_priority "$1")"
  local threshold="$(log_priority "$LOG_LEVEL")"
  [[ "$target" -le "$threshold" ]]
}

log() {
  local level="$1"
  shift
  if should_log "$level"; then
    printf '%s [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$level" "$*"
  fi
}

json_escape() {
  local s="${1//\\/\\\\}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  s="${s//"/\\\"}"
  printf '%s' "$s"
}

notify_pipeline() {
  local original="$1"
  local manifest="$2"
  local mp4="$3"
  local webm="$4"

  if [[ -z "$PIPELINE_API_URL" || -z "$PIPELINE_API_TOKEN" ]]; then
    log debug "Pipeline API not configured; skipping notification for $original"
    return
  fi

  if [[ "$DRY_RUN" == true ]]; then
    log info "(dry-run) would notify pipeline API about $original"
    return
  fi

  local payload
  payload=$(printf '{"filename":"%s","manifest_path":"%s","variants":{"mp4":"%s","webm":"%s"}}' \
    "$(json_escape "$original")" \
    "$(json_escape "$manifest")" \
    "$(json_escape "$mp4")" \
    "$(json_escape "$webm")")

  local tmp
  tmp=$(mktemp)
  local http_code
  if ! http_code=$("$CURL_BIN" -sS -w '%{http_code}' -o "$tmp" -X POST "$PIPELINE_API_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PIPELINE_API_TOKEN" \
      --data "$payload"); then
    log warn "Failed to invoke pipeline API for $original"
    rm -f "$tmp"
    return
  fi

  if [[ "$http_code" =~ ^2 ]]; then
    log info "Notified API that $original is processed"
  else
    log warn "Pipeline API returned $http_code for $original: $(tr -d '\r' < "$tmp")"
  fi
  rm -f "$tmp"
}

run_cmd() {
  if [[ "$DRY_RUN" == true ]]; then
    log debug "(dry-run) $*"
    return 0
  fi
  "$@"
}

ensure_dirs() {
  for dir in "$LOCAL_INBOX" "$LOCAL_OUTPUT" "$LOCAL_ARCHIVE" "$LOCAL_FAILED" "$LOCAL_STATE_DIR" "$LOCAL_LOG_DIR"; do
    [[ -d "$dir" ]] || run_cmd mkdir -p "$dir"
  done
}

sync_from_remote() {
  if [[ "$NO_SYNC" == true ]]; then
    log info "Skipping remote sync by request"
    return
  fi
  log info "Syncing uploads from $REMOTE_SSH:$REMOTE_UPLOAD_ROOT"
  local args=("-av" "--partial" "--prune-empty-dirs" "--exclude" "processed/" "--exclude" "avatars/" "--exclude" "*.${REMOTE_DONE_SUFFIX#.}")
  if [[ "$DRY_RUN" == true ]]; then
    args+=("--dry-run")
  fi
  "$RSYNC_BIN" "${args[@]}" "${REMOTE_SSH}:${REMOTE_UPLOAD_ROOT}/" "$LOCAL_INBOX/"
}

rel_path() {
  local abs="$1"
  echo "${abs#$LOCAL_INBOX/}"
}

mark_state() {
  local rel="$1"
  local state_file="$LOCAL_STATE_DIR/$rel.processed"
  local state_dir
  state_dir="$(dirname "$state_file")"
  run_cmd mkdir -p "$state_dir"
  run_cmd touch "$state_file"
}

has_state() {
  local rel="$1"
  [[ -f "$LOCAL_STATE_DIR/$rel.processed" ]]
}

build_public_url() {
  local rel="$1"
  if [[ -z "$PUBLIC_BASE_URL" ]]; then
    echo ""
  else
    local trimmed="${PUBLIC_BASE_URL%/}"
    rel="${rel#./}"
    echo "$trimmed/$rel"
  fi
}

upload_derivatives() {
  local output_dir="$1"
  local rel_dir_clean="$2"
  local stem="$3"
  local manifest_filename="$4"
  local remote_target="$REMOTE_PROCESSED_ROOT"
  if [[ -n "$rel_dir_clean" ]]; then
    remote_target="$REMOTE_PROCESSED_ROOT/$rel_dir_clean"
  fi

  log info "Uploading derivatives for $stem to $remote_target"
  if [[ "$DRY_RUN" == false ]]; then
    "$SSH_BIN" "$REMOTE_SSH" "mkdir -p '$remote_target'"
  else
    log debug "(dry-run) would ensure remote directory $remote_target"
  fi

  local rsync_src="$output_dir/"
  local rsync_dest="${REMOTE_SSH}:${remote_target}/"
  local rsync_args=(
    "-av"
    "--partial"
    "--include=*.mp4"
    "--include=*.webm"
    "--include=*.manifest.json"
    "--include=*${REMOTE_DONE_SUFFIX}"
    "--exclude=*"
  )
  if [[ "$DRY_RUN" == true ]]; then
    rsync_args+=("--dry-run")
  fi
  "$RSYNC_BIN" "${rsync_args[@]}" "$rsync_src" "$rsync_dest"

  if [[ "$DRY_RUN" == false ]]; then
    "$SSH_BIN" "$REMOTE_SSH" "touch '$remote_target/${stem}${REMOTE_DONE_SUFFIX}'"
  else
    log debug "(dry-run) would create remote done marker"
  fi
}

transcode_file() {
  local src="$1"
  local rel
  rel="$(rel_path "$src")"
  if [[ "$rel" == "$src" ]]; then
    log error "Input $src is outside the inbox"
    return 1
  fi
  if has_state "$rel"; then
    log debug "Skipping already processed $rel"
    return 0
  fi
  if [[ "$src" == *"$REMOTE_DONE_SUFFIX" ]]; then
    log debug "Skipping marker file $src"
    return 0
  fi

  local ext
  ext="${src##*.}"
  if [[ "$ext" == "$src" ]]; then
    ext=""
  else
    ext="${ext,,}"
  fi
  case "$ext" in
    mp4|mov|m4v|webm|mkv|mpg|mpeg|avi)
      ;;
    "")
      log info "Skipping file without extension: $rel"
      mark_state "$rel"
      return 0
      ;;
    *)
      log info "Skipping unsupported file type ($ext): $rel"
      mark_state "$rel"
      return 0
      ;;
  esac

  local rel_dir="$(dirname "$rel")"
  local rel_dir_clean
  if [[ "$rel_dir" == "." ]]; then
    rel_dir_clean=""
  else
    rel_dir_clean="$rel_dir"
  fi

  local stem="$(basename "$src")"
  stem="${stem%.*}"

  local output_dir
  if [[ -n "$rel_dir_clean" ]]; then
    output_dir="$LOCAL_OUTPUT/$rel_dir_clean"
  else
    output_dir="$LOCAL_OUTPUT"
  fi
  run_cmd mkdir -p "$output_dir"

  local archive_dir="$LOCAL_ARCHIVE"
  local failed_dir="$LOCAL_FAILED"
  if [[ -n "$rel_dir_clean" ]]; then
    archive_dir="$LOCAL_ARCHIVE/$rel_dir_clean"
    failed_dir="$LOCAL_FAILED/$rel_dir_clean"
  fi

  local mp4_path="$output_dir/$stem.mp4"
  local webm_path="$output_dir/$stem.webm"
  local manifest_filename="$stem.manifest.json"
  local manifest_path="$output_dir/$manifest_filename"
  local remote_rel_mp4
  local remote_rel_webm
  local remote_rel_manifest
  if [[ -n "$rel_dir_clean" ]]; then
    remote_rel_mp4="$rel_dir_clean/$stem.mp4"
    remote_rel_webm="$rel_dir_clean/$stem.webm"
    remote_rel_manifest="$rel_dir_clean/$manifest_filename"
  else
    remote_rel_mp4="$stem.mp4"
    remote_rel_webm="$stem.webm"
    remote_rel_manifest="$manifest_filename"
  fi

  log info "Transcoding $rel -> $(basename "$mp4_path"), $(basename "$webm_path")"

  if ! run_cmd "$FFMPEG_BIN" -y -i "$src" \
    -c:v libx264 -preset medium -crf 23 -g 48 -keyint_min 48 \
    -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
    -c:a aac -b:a 128k -movflags +faststart "$mp4_path"; then
    log warn "MP4 encode failed for $rel"
    run_cmd mkdir -p "$failed_dir"
    run_cmd mv "$src" "$failed_dir/"
    return 1
  fi

  if ! run_cmd "$FFMPEG_BIN" -y -i "$src" \
    -c:v libvpx-vp9 -crf 30 -b:v 0 -g 48 -keyint_min 48 -row-mt 1 \
    -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
    -c:a libopus -b:a 128k "$webm_path"; then
    log warn "WebM encode failed for $rel"
    run_cmd mkdir -p "$failed_dir"
    run_cmd mv "$src" "$failed_dir/"
    return 1
  fi

  local manifest_url_mp4="$(build_public_url "$remote_rel_mp4")"
  local manifest_url_webm="$(build_public_url "$remote_rel_webm")"
  local manifest_url_manifest="$(build_public_url "$remote_rel_manifest")"

  if [[ "$DRY_RUN" == false ]]; then
    cat > "$manifest_path" <<JSON
{
  "source": "$rel",
  "generated_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "variants": [
    {
      "type": "video/mp4",
      "path": "$remote_rel_mp4"${manifest_url_mp4:+,
      "url": "$manifest_url_mp4"}
    },
    {
      "type": "video/webm",
      "path": "$remote_rel_webm"${manifest_url_webm:+,
      "url": "$manifest_url_webm"}
    }
  ],
  "manifest": {
    "path": "$remote_rel_manifest"${manifest_url_manifest:+,
    "url": "$manifest_url_manifest"}
  }
}
JSON
  else
    log debug "(dry-run) would write manifest to $manifest_path"
  fi

  if [[ "$UPLOAD_DERIVATIVES" == true ]]; then
    upload_derivatives "$output_dir" "$rel_dir_clean" "$stem" "$manifest_filename"
  else
    log debug "Upload disabled; leaving derivatives locally"
  fi

  run_cmd mkdir -p "$archive_dir"
  if [[ "$PRESERVE_ORIGINALS" == true ]]; then
    run_cmd mv "$src" "$archive_dir/"
  else
    log debug "Deleting original $src"
    run_cmd rm -f "$src"
  fi

  mark_state "$rel"
  run_cmd touch "$output_dir/${stem}${REMOTE_DONE_SUFFIX}"
  notify_pipeline "$(basename "$src")" "$remote_rel_manifest" "$remote_rel_mp4" "$remote_rel_webm"
  return 0
}

process_inbox() {
  log info "Scanning inbox $LOCAL_INBOX"
  local find_cmd=(find "$LOCAL_INBOX" -type f ! -name "*${REMOTE_DONE_SUFFIX}" -print0)
  while IFS= read -r -d '' file; do
    if ! transcode_file "$file"; then
      log warn "Processing failed for $file"
    fi
  done < <("${find_cmd[@]}")
}

main() {
  ensure_dirs
  sync_from_remote
  process_inbox
  log info "Pipeline complete"
}

main "$@"
