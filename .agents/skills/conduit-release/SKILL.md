---
name: conduit-release
description: Use when creating, verifying, or troubleshooting Conduit releases. Covers semver bumping, changelog generation, preflights, release commit/tag/push, GitHub Actions monitoring, and updater asset verification.
version: '1.0.0'
---

# Conduit Release

Automates the Conduit release flow including semver bumping, changelog generation, and GitHub release verification.

## Before any release

Always run a dry-run first. It must pass without errors and leave the worktree clean.

```bash
./scripts/release-conduit.sh --bump <patch|minor|major> --dry-run
```

## Requirements

- Clean `main` branch up to date with `origin/main`.
- Authenticated `gh` CLI (`gh auth status`).
- No dirty worktree (including untracked files).

## Release command

Execute the real release only after a successful dry-run.

```bash
./scripts/release-conduit.sh --bump <patch|minor|major>
```

## After push

Monitor the release workflow and verify assets.

1. **Monitor**: `gh run list --workflow conduit.yml`
2. **Verify Assets**: `gh release view <tag> --json assets`
3. **Verify Updater**: Download `latest.json` and check version/platform signatures.

## Evidence

Collect all command outputs and verification results under:
`.omo/evidence/conduit-release-*`

## Guardrails

- **Targets**: macOS arm64 and Windows x64 only. No Linux.
- **Mode**: Immediate publish only. No draft releases.
- **Automation**: No automatic rollback or tag deletion on failure.
- **Updater**: No local `latest.json` generation; verify the one from GitHub.
- **Security**: Never print signing secrets or environment variables.
- **Scope**: Do not touch legacy Conduit code.

The `./scripts/release-conduit.sh` script is the source of truth. Do not manually duplicate its steps.
