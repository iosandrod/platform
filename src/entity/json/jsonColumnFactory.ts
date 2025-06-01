import { ColumnOptions } from 'typeorm'

let CURRENT_DB_TYPE = 'postgres'//

export function setCurrentDbType(type: string) {
  CURRENT_DB_TYPE = type
}

export function dateColumn(options: Partial<ColumnOptions> = {}): ColumnOptions {
  if (CURRENT_DB_TYPE === 'postgres') {
    return { type: 'timestamp', ...options }
  }
  if (CURRENT_DB_TYPE === 'mysql') {
    return { type: 'datetime', ...options }
  }
  if (CURRENT_DB_TYPE === 'mssql') {
    return { type: 'datetime', ...options }
  }
  return { type: 'text', ...options }
}

export function jsonColumn(options: Partial<ColumnOptions> = {}): ColumnOptions {
  if (CURRENT_DB_TYPE === 'postgres') {
    return { type: 'jsonb', ...options }
  }
  if (CURRENT_DB_TYPE === 'mysql') {
    return { type: 'json', ...options }
  }
  if (CURRENT_DB_TYPE === 'mssql') {
    return { type: 'simple-json', ...options }
  }
  return { type: 'text', ...options }
}