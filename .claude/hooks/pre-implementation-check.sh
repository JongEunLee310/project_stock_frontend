#!/usr/bin/env bash
set -euo pipefail

echo "pre-implementation-check: verifying Node and npm are available..."

if ! command -v node &>/dev/null; then
  echo "pre-implementation-check: node not found. Install Node.js 20 or newer."
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "pre-implementation-check: npm not found. Install Node.js (npm is bundled)."
  exit 1
fi

echo "pre-implementation-check: passed."
exit 0
