/**
 * Captures what loom reads from a live League client into loom/.sim/captures.json, the data of
 * loom's simulator (`?sim`). Only GETs; the file stays local (git-ignored) because it holds the account's name,
 * friends and chats.
 *
 * The client runs on Windows; this reaches it over ssh (cmd or PowerShell as the remote shell) and finds the
 * lockfile through RiotClientInstalls.json.
 *
 * Usage: pnpm run sim:capture -- [ssh options] user@host
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUTPUT = join(import.meta.dir, '..', 'loom', '.sim', 'captures.json')
const REMOTE_SCRIPT = 'shoma-sim-capture.ps1'
const REMOTE_ARCHIVE = 'shoma-sim-capture.tgz'

// $sid and $puuid come from the current summoner, read first
const PATHS = [
  '/lol-game-data/assets/v1/regalia.json',
  '/lol-game-data/assets/v1/summoner-spells.json',
  '/lol-champion-mastery/v1/local-player/champion-mastery',
  '/lol-champ-select/v1/bannable-champion-ids',
  '/lol-champ-select/v1/pickable-champion-ids',
  '/lol-champ-select/v1/pickable-skin-ids',
  '/lol-champ-select/v1/session',
  '/lol-lobby-team-builder/champ-select/v1/subset-champion-list',
  // Split into each champion's /skins below
  '/lol-champions/v1/inventories/$sid/champions',
  '/lol-champions/v1/inventories/$sid/skins-minimal',
  '/lol-champions/v1/inventories/$sid/480/champions-minimal-per-queue',
  '/lol-champions/v1/inventories/$sid/420/champions-minimal-per-queue',
  '/lol-clash/v1/all-tournaments',
  '/lol-clash/v1/visible',
  '/lol-collections/v1/inventories/$sid/ward-skins',
  '/lol-game-queues/v1/queues',
  '/lol-loadouts/v4/loadouts/scope/account',
  '/lol-gameflow/v1/session',
  '/lol-lobby/v2/ags/agsActivityId',
  '/lol-maps/v2/maps',
  '/lol-match-history/v1/recently-played-summoners',
  '/lol-perks/v1/currentpage',
  '/lol-perks/v1/pages',
  '/lol-perks/v1/perks',
  '/lol-perks/v1/styles',
  '/lol-perks/v1/quick-play-selections/champion/1/position/MIDDLE',
  '/lol-perks/v1/recommended-pages/champion/1/position/MIDDLE/map/11',
  '/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues',
  '/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues',
  '/lol-settings/v1/account/champ-select',
  '/lol-settings/v2/account/LCUPreferences/lol-champ-select',
  '/lol-chat/v1/conversations',
  '/lol-chat/v1/friend-groups',
  '/lol-chat/v1/friends',
  '/lol-chat/v1/me',
  '/lol-chat/v1/settings',
  '/lol-suggested-players/v1/suggested-players',
  '/lol-summoner/v1/current-summoner/rerollPoints',
  '/lol-summoner/v1/summoners/$sid',
  '/lol-challenges/v1/summary-player-data/player/$puuid',
  '/lol-regalia/v2/current-summoner/regalia',
  '/riotclient/region-locale',
]

const powershell = String.raw`
$ErrorActionPreference = 'Stop'
$installs = Get-Content (Join-Path $env:ProgramData 'Riot Games\RiotClientInstalls.json') -Raw | ConvertFrom-Json
$league = $installs.associated_client.PSObject.Properties.Name | Where-Object { $_ -match 'League of Legends' } | Select-Object -First 1
$parts = (Get-Content (Join-Path $league 'lockfile') -Raw).Split(':')
$port = $parts[2]; $pass = $parts[3]
$out = Join-Path $env:TEMP 'shoma-sim-capture'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory $out | Out-Null
$script:count = 0
function Get-Lcu($path) {
  $script:count += 1
  $file = Join-Path $out ("{0}.json" -f $script:count)
  $code = & curl.exe -k -s -u "riot:$pass" -o $file -w '%{http_code}' "https://127.0.0.1:$port$path"
  Add-Content (Join-Path $out 'index.tsv') ('{0}{3}{1}{3}{2}' -f $code, $path, (Split-Path $file -Leaf), [char]9)
  return $file
}
$me = Get-Content (Get-Lcu '/lol-summoner/v1/current-summoner') -Raw | ConvertFrom-Json
$sid = $me.summonerId; $puuid = $me.puuid
$paths = @(${PATHS.map((path) => {
  return `"${path}"`
}).join(', ')})
foreach ($p in $paths) { [void](Get-Lcu $p) }
tar czf (Join-Path $HOME '${REMOTE_ARCHIVE}') -C $env:TEMP shoma-sim-capture
Remove-Item $out -Recurse -Force
`

function run(cmd: string[], input?: string): string {
  const proc = Bun.spawnSync({
    cmd,
    stderr: 'pipe',
    stdin: input === undefined ? 'ignore' : Buffer.from(input),
    stdout: 'pipe',
  })
  const stderr = new TextDecoder().decode(proc.stderr)

  if (proc.exitCode !== 0) {
    throw new Error(`${cmd.join(' ')} failed (${proc.exitCode}): ${stderr.trim()}`)
  }

  return new TextDecoder().decode(proc.stdout)
}

function main(): void {
  // Pnpm passes its own -- through
  const sshArgs = process.argv.slice(2).filter((arg) => {
    return arg !== '--'
  })
  const target = sshArgs.at(-1)

  if (!target || target.startsWith('-')) {
    console.error('Usage: pnpm run sim:capture -- [ssh options] user@host')
    process.exit(1)
  }

  const options = sshArgs.slice(0, -1)
  const work = mkdtempSync(join(tmpdir(), 'shoma-sim-'))

  try {
    const local = join(work, REMOTE_SCRIPT)

    writeFileSync(local, powershell)
    run(['scp', '-q', ...options, local, `${target}:${REMOTE_SCRIPT}`])
    run(['ssh', ...options, target, `powershell -NoProfile -ExecutionPolicy Bypass -File ${REMOTE_SCRIPT}`])
    run(['scp', '-q', ...options, `${target}:${REMOTE_ARCHIVE}`, join(work, REMOTE_ARCHIVE)])
    run(['ssh', ...options, target, `powershell -NoProfile -Command Remove-Item ${REMOTE_SCRIPT}, ${REMOTE_ARCHIVE}`])
    run(['tar', 'xzf', join(work, REMOTE_ARCHIVE), '-C', work])

    const folder = join(work, 'shoma-sim-capture')
    const responses: Record<string, { content: unknown; status: number }> = {}

    for (const line of readFileSync(join(folder, 'index.tsv'), 'utf8').split(/\r?\n/)) {
      const [status, path, file] = line.split('\t')

      // Curl wrote the LCU's bytes as they came
      if (status && path && file) {
        const body = readFileSync(join(folder, file), 'utf8')

        responses[path] = { content: body.trim() === '' ? null : JSON.parse(body), status: Number(status) }
      }
    }

    // The full list only to answer each champion's skins as their own endpoint does (same content)
    for (const [path, response] of Object.entries(responses)) {
      if (/^\/lol-champions\/v1\/inventories\/\d+\/champions$/.test(path) && Array.isArray(response.content)) {
        delete responses[path]

        for (const champion of response.content) {
          responses[`${path}/${champion.id}/skins`] = { content: champion.skins ?? [], status: response.status }
        }
      }
    }

    mkdirSync(join(OUTPUT, '..'), { recursive: true })
    writeFileSync(OUTPUT, JSON.stringify({ capturedAt: new Date().toISOString(), responses }))
    console.log(`${Object.keys(responses).length} responses → ${OUTPUT}`)
  } finally {
    rmSync(work, { force: true, recursive: true })
  }
}

main()
