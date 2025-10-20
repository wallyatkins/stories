# Out-of-Band Video Pipeline

This folder contains tooling for a home-network worker that mirrors raw uploads from the production server, transcodes them into browser-friendly formats, and returns the derivatives for playback in the web app.

## Host Requirements
- macOS (Apple Silicon) or Linux with a POSIX shell
- `ffmpeg` with libx264, libvpx-vp9, libopus, and AAC support (Homebrew: `brew install ffmpeg`, Debian/Ubuntu: `sudo apt install ffmpeg`)
- `rsync` and `ssh` for file transfer (preinstalled on most macOS/Linux systems)
- `cron` (or launchd/systemd) for scheduling recurring runs

## Directory Layout
- `process_videos.sh` – orchestrates sync, transcode, and upload
- `.env.example` – configuration template loaded by the script
- `cron.example` – sample cron entry for periodic execution
- `notes.md` – space for environment-specific tweaks or credentials runbook entries

Place the files on the worker machine (e.g., `/opt/stories-pipeline`) and keep the working tree protected; the script writes logs and state alongside itself by default.

## Configuration
1. Copy `.env.example` to `.env` and adjust values such as `REMOTE_SSH`, `REMOTE_UPLOAD_ROOT`, and paths for local staging. Provide the `PIPELINE_API_URL` and `PIPELINE_API_TOKEN` when you are ready for the worker to notify the web app after processing finishes.
2. Ensure passwordless SSH from the worker to the server: generate an SSH key, add it to the server user's `~/.ssh/authorized_keys`, and test with `ssh <user>@<host>`.
3. Create the local directories from `.env` (`LOCAL_INBOX`, `LOCAL_OUTPUT`, `LOCAL_LOG_DIR`). The script will create them when missing, but pre-creating helps with permissions.

## Execution Flow
1. `rsync` pulls unprocessed files from `<server>/uploads/` into the local inbox.
2. Each new file is transcoded to MP4 (H.264/AAC) and WebM (VP9/Opus) using the recommended flags.
3. Derivatives and a JSON manifest named `<original>.manifest.json` are uploaded back to the server under `/uploads/processed/<id>/` (configurable via `.env`).
4. The script writes a `.done` marker locally and, optionally, on the server to prevent duplicate work.
5. When `PIPELINE_API_URL`/`PIPELINE_API_TOKEN` are configured the script calls back into the application to mark the prompt as processed and trigger recipient email delivery.

## Scheduling & Monitoring
- Run the script manually (`./process_videos.sh`) while validating the workflow; add `--dry-run` to audit without changes.
- Add the cron entry from `cron.example` once stable; redirect stdout/stderr to the log file defined by `LOCAL_LOG_DIR`.
- Review logs and the `failed/` directory after each run. Encodes that error out are moved there for inspection and retry.

## Playback Integration
ReactPlayer (or any `<video>` tag with source fallbacks) should reference the MP4 and WebM paths written to the manifest. During front-end integration ensure the PHP API exposes these URLs when the `.done` marker appears on the server.
