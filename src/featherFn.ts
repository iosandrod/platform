import { errors } from '@feathersjs/errors'
import { myFeathers } from './feather'
import Knex from 'knex'


export const columnToTable = (column: any[]) => {
  let allColumns = column
  allColumns.forEach((col: any) => {
    col.tableName = col.table_name //
    let field = col.column_name
    col.field = field
    let nullable = col.is_not_null
    nullable = !nullable //
    col.nullable = nullable
    let defaultValue = col.column_default
    col.defaultValue = defaultValue
    let maxLength = col.character_maximum_length
    col.maxLength = maxLength //
    col.type = col.data_type //
  })
  let tables = allColumns.reduce((p: any, column: any) => {
    let table_name = column.table_name //
    let tableObj = p[table_name]
    let table_type = column.table_type
    if (tableObj == null) {
      if (table_type == 'v') {
      }
      p[table_name] = {
        columns: [],
        tableName: table_name, //
        isView: table_type == 'v'
      }
      tableObj = p[table_name]
    }
    tableObj.columns.push(column) 
    return p //
  }, {})
  return tables //
}
