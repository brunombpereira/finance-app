import { describe, expect, it } from 'vitest'
import { parseAmount, parseCsv, parseFlexibleDate } from './csv'

describe('parseCsv', () => {
  it('parses headers and rows', () => {
    const { headers, rows } = parseCsv('Data,Descrição,Valor\n2026-01-02,Café,-2.50')
    expect(headers).toEqual(['Data', 'Descrição', 'Valor'])
    expect(rows).toEqual([['2026-01-02', 'Café', '-2.50']])
  })

  it('handles quoted fields with commas', () => {
    const { rows } = parseCsv('a,b\n"hello, world",2')
    expect(rows[0]).toEqual(['hello, world', '2'])
  })

  it('handles escaped quotes', () => {
    const { rows } = parseCsv('a\n"say ""hi"""')
    expect(rows[0]).toEqual(['say "hi"'])
  })

  it('accepts semicolon as a separator', () => {
    const { headers } = parseCsv('Data;Valor\n2026-01-01;10')
    expect(headers).toEqual(['Data', 'Valor'])
  })

  it('ignores blank lines', () => {
    const { rows } = parseCsv('a,b\n1,2\n\n3,4\n')
    expect(rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })
})

describe('parseFlexibleDate', () => {
  it('accepts ISO dates', () => {
    expect(parseFlexibleDate('2026-05-14')).toBe('2026-05-14')
  })

  it('accepts dd/mm/yyyy', () => {
    expect(parseFlexibleDate('14/05/2026')).toBe('2026-05-14')
  })

  it('accepts dd-mm-yyyy and dd.mm.yyyy', () => {
    expect(parseFlexibleDate('5-3-2026')).toBe('2026-03-05')
    expect(parseFlexibleDate('5.3.2026')).toBe('2026-03-05')
  })

  it('returns null for unrecognised input', () => {
    expect(parseFlexibleDate('not a date')).toBeNull()
  })
})

describe('parseAmount', () => {
  it('parses a plain number', () => {
    expect(parseAmount('1234.56')).toBe(1234.56)
  })

  it('parses comma as decimal separator', () => {
    expect(parseAmount('-2,50')).toBe(-2.5)
  })

  it('parses european thousands + decimal', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
  })

  it('parses us thousands + decimal', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56)
  })

  it('strips currency symbols', () => {
    expect(parseAmount('€ 99,90')).toBe(99.9)
  })

  it('returns null for non-numeric input', () => {
    expect(parseAmount('abc')).toBeNull()
  })
})
