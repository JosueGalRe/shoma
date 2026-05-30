#!/bin/bash
set -euo pipefail
bun scripts/release-conduit.ts "$@"
