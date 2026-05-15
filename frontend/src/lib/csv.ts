import type { Transaction } from '../api/types'

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadTransactionsCsv(transactions: Transaction[]) {
  const header = ['Data', 'Tipo', 'Categoria', 'Nota', 'Valor']
  const rows = transactions.map((t) => [
    t.date,
    t.type === 'Income' ? 'Receita' : 'Despesa',
    t.categoryName,
    t.note,
    t.amount.toFixed(2),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
    .join('\n')

  // BOM so Excel reads UTF-8 (accented category names) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes and
// embedded commas/newlines. Good enough for bank statement exports.
export function parseCsv(text: string): ParsedCsv {
  // Strip a leading byte-order mark if present.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',' || ch === ';') {
      record.push(field)
      field = ''
    } else if (ch === '\n') {
      record.push(field)
      records.push(record)
      field = ''
      record = []
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmpty.length === 0) return { headers: [], rows: [] }
  const [headers, ...rows] = nonEmpty
  return { headers: headers.map((h) => h.trim()), rows }
}

// Parses common bank date formats into an ISO yyyy-mm-dd string, or null.
export function parseFlexibleDate(value: string): string | null {
  const s = value.trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

// Parses an amount that may use either `,` or `.` as the decimal separator.
export function parseAmount(value: string): number | null {
  let s = value.trim().replace(/\s/g, '').replace(/[€$£]/g, '')
  if (!s) return null
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // The right-most separator is the decimal one.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
