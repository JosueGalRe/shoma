import { describe, expect, it } from 'bun:test'

import { Icon } from '../src'

describe('Icon', () => {
  it('maps size tokens to the design-system scale and defaults to text', () => {
    const element = Icon({ name: 'settings' })

    expect(element.props.size).toBe(20)
    expect(element.props.color).toBe('var(--shoma-text)')
    expect(element.props.className).toBe('shrink-0')
  })

  it('supports custom numeric size and tone tokens', () => {
    const element = Icon({ className: 'inline-flex', name: 'settings', size: 32, tone: 'primary' })

    expect(element.props.size).toBe(32)
    expect(element.props.color).toBe('var(--shoma-primary)')
    expect(element.props.className).toBe('shrink-0 inline-flex')
  })
})
