import { describe, expect, it } from 'vitest'
import { extractUrl } from './extractUrl'

describe('extractUrl', () => {
  it('finds a link inside shared text', () => {
    expect(
      extractUrl(
        'Regarde cette publication https://www.instagram.com/p/abc/?igsh=xyz',
      ),
    ).toBe('https://www.instagram.com/p/abc/?igsh=xyz')
  })

  it('drops punctuation that ends the sentence', () => {
    expect(extractUrl('See https://example.com/page.')).toBe(
      'https://example.com/page',
    )
  })

  it('returns undefined without a link', () => {
    expect(extractUrl('no link here')).toBeUndefined()
    expect(extractUrl(undefined)).toBeUndefined()
  })
})
