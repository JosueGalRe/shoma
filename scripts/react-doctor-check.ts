import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type ReactDoctorJsonReport = {
  ok: boolean
  summary?: {
    score?: number
  }
  diagnostics?: unknown[]
}

type RootConfig = {
  reactDoctor?: {
    projects?: string[]
    scoreThreshold?: number
  }
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const packageJsonPath = join(repoRoot, 'package.json')
const defaultThreshold = 75

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const parseJson = (value: string): ReactDoctorJsonReport => {
  const parsed = JSON.parse(value) as Partial<ReactDoctorJsonReport>

  if (typeof parsed.ok !== 'boolean') {
    throw new Error('react-doctor did not return an ok flag')
  }

  return {
    ok: parsed.ok,
    summary: typeof parsed.summary?.score === 'number' ? { score: parsed.summary.score } : undefined,
    diagnostics: Array.isArray(parsed.diagnostics) ? parsed.diagnostics : [],
  }
}

const runReactDoctor = async (project: string) => {
  const childProcess = Bun.spawn({
    cmd: ['bunx', 'react-doctor', '--json', '--offline', '--yes', project],
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(childProcess.stdout).text(),
    new Response(childProcess.stderr).text(),
    childProcess.exited,
  ])

  return { stdout, stderr, exitCode }
}

const main = async () => {
  const rawConfig = await readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(rawConfig) as RootConfig

  const cliProjects = process.argv.slice(2).filter(Boolean)
  const configProjects = isStringArray(packageJson.reactDoctor?.projects)
    ? packageJson.reactDoctor.projects
    : ['web', 'conduit']
  const projects = cliProjects.length > 0 ? cliProjects : configProjects
  const threshold = packageJson.reactDoctor?.scoreThreshold ?? defaultThreshold

  if (projects.length === 0) {
    throw new Error('No react-doctor projects configured')
  }

  const failures: string[] = []
  const results: Array<{ project: string; score: number | null }> = []

  for (const project of projects) {
    const { stdout, stderr, exitCode } = await runReactDoctor(project)
    if (stderr.trim().length > 0) {
      console.error(stderr.trimEnd())
    }

    let report: ReactDoctorJsonReport
    try {
      report = parseJson(stdout)
    } catch (error) {
      failures.push(`${project}: invalid react-doctor JSON (${error instanceof Error ? error.message : String(error)})`)
      continue
    }

    const score = report.summary?.score ?? null
    results.push({ project, score })

    if (!report.ok) {
      failures.push(`${project}: react-doctor reported ok=false`)
      continue
    }

    if (typeof score !== 'number') {
      failures.push(`${project}: missing summary.score`)
      continue
    }

    if (score < threshold) {
      failures.push(`${project}: score ${score} is below threshold ${threshold}`)
    }

    if (exitCode !== 0 && score === null) {
      failures.push(`${project}: react-doctor exited with code ${exitCode} and returned no score`)
    }
  }

  if (failures.length > 0) {
    console.error(`react-doctor check failed:\n- ${failures.join('\n- ')}`)
    globalThis.process.exitCode = 1
    return
  }

  console.log(`react-doctor check passed (${results.map((result) => `${result.project}:${result.score ?? 'n/a'}`).join(', ')})`)
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  globalThis.process.exitCode = 1
})
