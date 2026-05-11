import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./ready-check-overlay.tsx', import.meta.url), 'utf8')

describe('ReadyCheckOverlay', () => {
  test('hides outside ReadyCheck phase', () => {
    expect(source).toContain('if (!isVisible)')
    expect(source).toContain('return null')
  })

  test('shows during ReadyCheck phase', () => {
    expect(source).toContain('data-testid=\'ready-check-overlay\'')
  })

  test('renders without the removed pulse border and card blur', () => {
    expect(source).not.toContain('animate-pulse rounded-lg border')
    expect(source).toContain('relative overflow-hidden border border-lol-border-gold/40 bg-lol-navy-900/85')
  })

  test('locks body scroll when visible', () => {
    expect(source).toContain("document.body.style.overflow = 'hidden'")
  })

  test('restores body scroll when hidden', () => {
    expect(source).toContain('document.body.style.overflow = previousBodyOverflowRef.current ?? \'\'')
  })
})
