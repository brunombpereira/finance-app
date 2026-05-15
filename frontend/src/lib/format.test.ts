import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, monthLabel } from './format'

describe('formatMoney', () => {
  it('formats positive amounts as euros', () => {
    expect(formatMoney(1500)).toContain('1500')
    expect(formatMoney(1500)).toContain('€')
  })

  it('formats negative amounts', () => {
    expect(formatMoney(-42.5)).toContain('42,5')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0,00')
  })
})

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2026-05-14')
    expect(result).toContain('2026')
    expect(result).toContain('14')
  })
})

describe('monthLabel', () => {
  it('returns the abbreviated month name', () => {
    expect(monthLabel(1)).toBe('Jan')
    expect(monthLabel(5)).toBe('Mai')
    expect(monthLabel(12)).toBe('Dez')
  })

  it('falls back to the number for out-of-range values', () => {
    expect(monthLabel(99)).toBe('99')
  })
})
