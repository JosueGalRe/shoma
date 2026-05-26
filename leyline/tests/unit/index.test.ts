import { describe, expect, it } from 'bun:test'

import { extractConduitAuth } from '../../src/index'

describe('extractConduitAuth', () => {
  it('supports legacy header token/public-key', () => {
    const auth = extractConduitAuth({
      headers: {
        'public-key': 'header-pubkey',
        token: 'header-token',
      },
    })

    expect(auth).toEqual({ publicKey: 'header-pubkey', token: 'header-token' })
  })

  it('falls back to request URL query params', () => {
    const auth = extractConduitAuth({
      request: new Request('http://localhost/conduit?token=url-token&publicKey=url-pubkey'),
    })

    expect(auth).toEqual({ publicKey: 'url-pubkey', token: 'url-token' })
  })
})
