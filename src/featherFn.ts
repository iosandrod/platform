import { errors } from '@feathersjs/errors'
import { myFeathers } from './feather'
import { Knex } from 'knex'

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

export const batchInsert = async (knex1: Knex, knex2: Knex, table: string, chunkSize = 500) => {
  // console.log(knex1, knex2, table) //
  let getIdSql = `SELECT
  kcu.column_name
FROM
  information_schema.table_constraints tc
JOIN
  information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.constraint_schema = kcu.constraint_schema
WHERE
  tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name = '${table}'
  AND tc.table_schema = 'public';`
  let result = await knex1.raw(getIdSql)
  let primaryKey = result.rows[0].column_name
  // 1. 查询源数据
  const sourceData = await knex1(table).select()

  if (!sourceData.length) {
    console.log(`[batchInsert] 表 ${table} 无数据，跳过`)
    return
  }
  // 2. 转换布尔为数字（可选）
  let data = sourceData.map(row => {
    let result = { ...row }
    for (const key in result) {
      if (typeof result[key] === 'boolean') {
        result[key] = result[key] ? 1 : 0
      }
      if (typeof result[key] === 'object' && result[key] != null) {
        result[key] = JSON.stringify(result[key]) //
      }
    }
    return result
  })//

  const ids = data.map(r => r[primaryKey])

  // 3. 事务执行删除 + 插入
  await knex2.transaction(async trx => {
    await trx(table).whereIn(primaryKey, ids).del()
    await trx.batchInsert(table, data, chunkSize)
  })
  //
  // console.log(`[batchInsert] 表 ${table} 同步完成，共 ${data.length} 条`)
}
