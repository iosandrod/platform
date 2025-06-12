import { myFeathers } from './feather'
import { columnToTable } from './featherFn'
import { createNodeGrid } from './utils'

export const getDefaultPageLayout = async (_this: myFeathers, tableName: any) => {
  let allTable = await _this.getCompanyTable()
  //本地的表格
  console.log(tableName, 'allTable')//
  let tableConfig = allTable[tableName]
  if (tableConfig == null) {//
    let sql = `SELECT 
    cols.attname AS column_name,
    tbl.relname AS table_name,
    tbl.relkind AS table_type,
    ns.nspname AS table_schema,
    cols.attnum AS ordinal_position,
    pg_catalog.format_type(cols.atttypid, cols.atttypmod) AS data_type,
    cols.attnotnull AS is_not_null,
    pg_catalog.col_description(cols.attrelid, cols.attnum) AS column_comment,
    -- 主键判断
    CASE 
        WHEN pk.conkey IS NOT NULL AND cols.attnum = ANY(pk.conkey) THEN true
        ELSE false
    END AS is_primary_key
FROM 
    pg_catalog.pg_attribute cols
JOIN 
    pg_catalog.pg_class tbl ON cols.attrelid = tbl.oid
JOIN 
    pg_catalog.pg_namespace ns ON tbl.relnamespace = ns.oid
LEFT JOIN 
    pg_catalog.pg_constraint pk ON pk.conrelid = tbl.oid AND pk.contype = 'p'
WHERE 
    cols.attnum > 0 
    AND NOT cols.attisdropped
    AND tbl.relkind IN ('r', 'v')  -- 只查真正的表，排除视图（'v'）和其他类型
    AND ns.nspname = 'public'
		AND tbl.relname ='${tableName}'
ORDER BY 
    tbl.relname, cols.attnum;
`
    let pgClient = await _this.getClient()//
    let res = await pgClient.raw(sql)
    let _cols = res.rows //////
    if (_cols.length == 0) {
      return null
    }
    // throw new errors.NotFound(`table ${tableName} not found`) ////
    let tables = columnToTable(_cols)
    let allTable = await _this.getCompanyTable() //
    Object.entries(allTable).forEach(([key, value]) => (allTable[key] = tables[key]))
    await _this.initTableService() //
    tableConfig = tables[tableName] //
  }
  let config = {
    layout: {
      pc: [],

      mobile: [
        {
          columns: [],
          ..._this.createIdKey('inline')
        }
      ]
    },
    fields: [],
    data: {},
    logic: {}
  }
  let enF = { ..._this.createIdKey('entity', tableConfig) }
  let btnF = {
    ..._this.createIdKey('buttongroup', {
      items: [
        {
          label: '新增'
        },
        {
          label: '查询'
        }
      ]
    })
  } //
  let enId = enF.id
  let sRow = createNodeGrid(enId, _this)
  let btnId = btnF.id
  let btnRow = createNodeGrid(btnId, _this)
  let pcLayout = config.layout.pc as any
  pcLayout.push(...[btnRow, sRow])
  let f: any[] = config.fields
  f.push(...[btnF, enF])

  return config //
}

export const getDefaultEditPageLayout = async (_this: myFeathers, tableName: any) => {
  let allTable = await _this.getCompanyTable() //
  //本地的表格
  let tableConfig = allTable[tableName]

  if (tableConfig == null) {
    // throw new errors.NotFound(`table ${tableName} not found`) ////
    return null //
  }
  let config = {
    layout: {
      pc: [],

      mobile: [
        {
          columns: [],
          ..._this.createIdKey('inline')
        }
      ]
    },
    fields: [],
    data: {},
    logic: {}
  }
  let lF = { ..._this.createIdKey('dform'), options: {} }
  let fId = lF.id
  let enF = {
    ..._this.createIdKey('tabs', {}), //
    columns: [
      {
        ..._this.createIdKey('tabsCol'),
        label: '表单',
        list: [
          {
            ..._this.createIdKey('inline'),
            columns: [
              //
              fId
            ]
          }
        ]
      }
    ]
  }
  let btnF = {
    ..._this.createIdKey('buttongroup', {
      items: [
        {
          label: '新增'
        },
        {
          label: '保存'
        },
        {
          label: '编辑' //
        }
      ]
    })
  }
  let btnId = btnF.id
  let btnRow = createNodeGrid(btnId, _this)
  let pcLayout = config.layout.pc as any
  let _nodeEnf = createNodeGrid(enF, _this)
  pcLayout.push(...[btnRow, _nodeEnf]) //
  let f: any[] = config.fields
  f.push(...[btnF, lF]) //
  return config
}

export const getDefaultImportPageLayout = async (_this: myFeathers, tableName: any, params: any) => {
  let allTable = await _this.getCompanyTable() //
  //本地的表格
  let tableConfig = allTable[tableName]
  if (tableConfig == null) {
    // throw new errors.NotFound(`table ${tableName} not found`) ////
    return null //
  }
  let config = {
    layout: {
      pc: [],

      mobile: [
        {
          columns: [],
          ..._this.createIdKey('inline')
        }
      ]
    },
    fields: [],
    data: {},
    logic: {}
  }
  let enF = { ..._this.createIdKey('entity', tableConfig) }
  let btnF = {
    ..._this.createIdKey('buttongroup', {
      items: [
        {
          label: '新增'
        },
        {
          label: '查询'
        }
      ]
    })
  }
  let enId = enF.id
  let sRow = createNodeGrid(enId, _this)
  let btnId = btnF.id
  let btnRow = createNodeGrid(btnId, _this)
  let pcLayout = config.layout.pc as any
  pcLayout.push(...[btnRow, sRow])
  let f: any[] = config.fields
  f.push(...[btnF, enF])

  return config //
}
