#!/usr/bin/env bash
# Helper to run alembic commands from repo root or inside container.
# Usage: ./backend/run_alembic.sh upgrade head

set -euo pipefail
cd "$(dirname "$0")"
# run alembic with the backend alembic.ini
alembic -c alembic.ini "$@"
