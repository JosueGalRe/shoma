import { describe, expect, it } from 'bun:test'

import { extractConduitAuth } from '../../src/index'

describe('extractConduitAuth', () => {
  it('supports legacy header token/public-key', () => {
    const auth = extractConduitAuth({
      headers: {
        token: 'header-token',
        'public-key': 'header-pubkey',
      },
    })

    expect(auth).toEqual({ token: 'header-token', publicKey: 'header-pubkey' })
  })

  it('falls back to request URL query params', () => {
    const auth = extractConduitAuth({
      request: new Request('http://localhost/conduit?token=url-token&publicKey=url-pubkey'),
    })

    expect(auth).toEqual({ token: 'url-token', publicKey: 'url-pubkey' })
  })
})
