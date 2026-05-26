import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'

describe('runRealtime boundary', () => {
  it('resolves when the Effect succeeds', async () => {
    expect(Effect.runPromise(Effect.succeed('ok'))).resolves.toBe('ok')
  })

  it('rejects with the failed error when the Effect fails', async () => {
    const error = new Error('boom')

    try {
      await Effect.runPromise(Effect.fail(error))
      throw new Error('Expected runPromise to reject.')
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(Error)
      expect(String(caughtError)).toContain('boom')
    }
  })

  it('emits an unhandled rejection when the returned promise is discarded', () => {
    const result = Bun.spawnSync({
      cmd: [
        'bun',
        '-e',
        [
          "import { Effect } from 'effect'",
          "void Effect.runPromise(Effect.die(new Error('defect')))" ,
          'await Bun.sleep(10)',
        ].join('; '),
      ],
      stderr: 'pipe',
      stdout: 'pipe',
    })

    const stderr = new TextDecoder().decode(result.stderr)

    expect(result.exitCode).not.toBe(0)
    expect(stderr).toContain('defect')
  })
})
