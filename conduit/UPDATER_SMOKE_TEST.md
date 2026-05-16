# Tauri updater smoke test

Manual end-to-end smoke test for verifying Conduit update detection, prompting, installation, and relaunch behavior.

## Prerequisites

- Two release versions are needed:
  - Version N-1: the already-installed baseline, for example `conduit-v0.1.0`.
  - Version N: the update target, for example `conduit-v0.1.1`.
- Tauri updater signing secrets must be configured for the release workflow so updater artifacts and signatures are published.
- The updater endpoint in `conduit/src-tauri/tauri.conf.json` must point at the GitHub release `latest.json` asset.
- Use a clean machine or remove any existing Conduit install before starting, so the installed baseline is known.

## Steps

1. Build and install version N-1.
   - Check out the baseline tag, for example `conduit-v0.1.0`.
   - Build the Conduit bundle for the target platform.
   - Install the generated app or installer.
   - Launch it once and verify the running app reports version `0.1.0`.

2. Bump Conduit to version N.
   - Update `version` in `conduit/src-tauri/tauri.conf.json`, for example from `0.1.0` to `0.1.1`.
   - Commit the version bump.

3. Push the version N tag.
   - Create and push the release tag, for example `conduit-v0.1.1`.

4. Wait for the release workflow to publish.
   - Confirm the workflow completes successfully.
   - Open the GitHub release for `conduit-v0.1.1`.
   - Verify `latest.json` exists in the release assets.

5. Open the installed version N-1 app.
   - Launch the already-installed `0.1.0` build.
   - Verify it detects version `0.1.1` and shows the updater prompt.

6. Verify the updater prompt content.
   - Confirm the prompt shows the correct update version.
   - Confirm the prompt shows the expected release date.
   - Confirm the prompt shows the expected release notes.

7. Test dismissing the update.
   - Click **Later**.
   - Verify the prompt dismisses.
   - Verify the prompt does not reappear during the same app session for the same version.

8. Test prompt behavior after restart.
   - Quit and restart the installed `0.1.0` app.
   - Verify the updater prompt reappears unless version `0.1.1` was explicitly dismissed according to the current app behavior.

9. Start installation.
   - Click **Install now**.
   - Verify a progress bar appears and advances while the update downloads and installs.

10. Verify relaunch.
    - Wait for the installer to finish.
    - Verify the app relaunches automatically into the updated build.

11. Verify the running version.
    - Confirm the relaunched app reports version `0.1.1`.
    - Restart once more and confirm no update prompt appears for `0.1.1`.

## Fallback validation

If a live updater test cannot be run, manually validate the published `latest.json` release asset before treating the release as update-ready.

1. Download `latest.json` from the GitHub release assets.
2. Verify `version` matches version N, for example `0.1.1`.
3. Verify the release date is present and valid.
4. Verify release notes/body content is present and matches the intended release.
5. Verify every expected platform entry exists under `platforms`.
6. For each platform entry, verify:
   - `url` points to the correct updater artifact in the release.
   - `signature` is present and non-empty.
7. Confirm the artifact URLs are downloadable and correspond to the same version as `latest.json`.

Fallback validation only checks release metadata and signatures. It does not replace a live install/update/relaunch smoke test before shipping to users.
