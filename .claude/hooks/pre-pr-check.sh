#!/usr/bin/env bash
set -euo pipefail

echo "pre-pr-check: running lint and tests..."
npm run lint
npm run test
echo "pre-pr-check: passed."
exit 0
