import jwt from 'jsonwebtoken'

export function getJwtSecret(): string {
  const secret = Bun.env.LEYLINE_JWT_SECRET
  if (!secret) {
    throw new Error('LEYLINE_JWT_SECRET is required for this test.')
  }

  return secret
}

export function readTokenFromRegisterBody(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Expected register response object.')
  }

  if (!('token' in body) || typeof body.token !== 'string') {
    throw new Error('Expected register response token.')
  }

  return body.token
}

export function readCodeFromToken(token: string): string {
  const decoded = jwt.verify(token, getJwtSecret())
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Expected JWT payload object.')
  }

  if (!('code' in decoded) || typeof decoded.code !== 'string') {
    throw new Error('Expected JWT payload code.')
  }

  return decoded.code
}
