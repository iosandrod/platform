import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
import { createApp } from './app/app_index'
import knex, { Knex } from 'knex'
import { cacheValue } from './decoration'
import { nanoid } from './utils'
import { errors } from '@feathersjs/errors'
// const nanoid = () => 'xxxxx' //
export const subAppCreateMap = {
  erp: createApp //
}
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
  captchaData: any = {}
  mainApp?: myFeathers
  cache: { [key: string]: any } = {}
  cacheKnex: { [key: string]: Knex } = {}
  subApp: {
    [key: string]: Application
  } = {}
  async getAllSubApp() {
    const services = this.services //
  } //
  async getAllCompany() {
    const companyService = this.service('company') //
    const company = await companyService.find() //
    return company ////
  } //
  async createCompany(config: any) {
    let client: Knex = this.get('postgresqlClient')
    let name = config.name //创建公司
    let companies = await client('company').where('name', name).select() //
    if (companies.length === 0) {
      let connection = config.connection
      let type = config.type
      if (connection == null) {
        return
      }
      let _client = knex({
        client: type,
        connection: connection
      })
      await client('company').insert(config) //
    }
  }
  @cacheValue() //
  async getRoles(userid: string) {
    let client = this.getPgClient()
    let sql = client('roles')
      .join('user_roles', 'roles.id', '=', 'user_roles.rolesId')
      .where('user_roles.usersId', userid)
      .select('roles.*')
      .toQuery() //
    let data = await client.raw(sql)
    let rows = data.rows
    return rows //
  }
  getPgClient(): Knex {
    return this.get('postgresqlClient')
  }
  @cacheValue((id: any) => {
    if (Array.isArray(id)) {
      return id.join(',')
    } else {
      return id //
    }
  })
  async getPermissions(roleid: string) {
    let s = this.service('permissions')
    let permissions = await s.find()
    if (typeof roleid == 'string') {
      //@ts-ignore
      roleid = [roleid]
    } else if (Array.isArray(roleid)) {
      roleid = roleid
    }
    permissions = permissions.filter((p: any) => roleid.includes(p.roleid)) ////
    return permissions
  }
  @cacheValue()
  getUserPermissions(userid: string) {
    let roles = this.getRoles(userid)
  }
  async getAllApp() {} //
  async getCurrentTable() {}
  //@ts-ignore
  async getCompanyConnection(company: any, appName?: string): Promise<Knex> {
    let client = this.getClient()
    if (typeof company === 'string') {
      let cacheKnex = this.cacheKnex
      let _key = `${appName}--${company}`
      let _knex = cacheKnex[_key]
      if (_knex != null) {
        return _knex //
      }
      if (appName == null) {
        return this.getPgClient() //
      } //
      let companyInfo = await client('company')
        .where({
          companyid: company,
          appName: appName
        })
        .select() ////
      let row = companyInfo[0]
      if (row == null) {
        throw new Error(`company ${company} not found`) //
      }
      let connection = companyInfo[0].connection //
      let type = companyInfo[0].type //
      let _client = knex({
        client: type,
        connection: connection
      })
      cacheKnex[_key] = _client ////
      return _client
    }
    if (typeof company === 'object') {
      let connection = company.connection
      let type = company.type
      let name = company.name
      if (this.cacheKnex[name] != null) return this.cacheKnex[name] //
      let _client = knex({
        client: type,
        connection: connection
      })
      this.cacheKnex[name] = _client //
      return _client
    }
  }
  @cacheValue((companyid?: string, appName?: string) => {
    if (companyid == null) {
      companyid = ''
    }
    if (appName == null) {
      appName = ''
    }
    return `${companyid}--${appName}`
  }) //
  async getCompanyTable(companyid?: string, appName?: string) {
    //@ts-ignore
    let _this: myFeathers = this.getMainApp()
    //@ts-ignore
    let _connect: Knex = null
    if (companyid == null) {
      _connect = this.get('postgresqlClient')
    } else {
      _connect = await _this.getCompanyConnection(companyid, appName) //
    }
    let sql = `SELECT 
    cols.attname AS column_name,
    tbl.relname AS table_name,
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
    AND tbl.relkind = 'r'  -- 只查真正的表，排除视图（'v'）和其他类型
    AND ns.nspname = 'public'
ORDER BY 
    tbl.relname, cols.attnum;
`
    let allColumns = await _connect.raw(sql) //////
    allColumns = allColumns.rows
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
      if (tableObj == null) {
        p[table_name] = {
          columns: [],
          tableName: table_name //
        }
        tableObj = p[table_name]
      }
      tableObj.columns.push(column) ////
      return p //
    }, {})
    return tables //
  } //
  clearCache(fnName: string, key: string) {
    //
    if (fnName == null) {
      return
    }
    let cache = this.cache
    let allKeys = Object.keys(cache)
    for (const key of allKeys) {
      let reg = new RegExp(`^${fnName}--`) //
      if (reg.test(key)) {
        delete cache[key] //
      }
    }
  }
  getClient() {
    return this.get('postgresqlClient')
  }
  async registerSubApp(appName: keyof typeof subAppCreateMap, companyId: string) {
    const allEn = null
    let c: Knex = this.get('postgresqlClient')
    const createFn = subAppCreateMap[appName] //
    if (typeof createFn !== 'function') return // 不存在的服务不需要注册
    //@ts-ignore
    const subApp = await createFn(this, companyId) //
    let key = `${appName}_${companyId}` //
    let routePath = `/${key}` //
    this.use(routePath, subApp)
    let subAppMap = this.subApp
    //@ts-ignore
    subAppMap[key] = subApp
    return subApp
  }
  getMainApp() {
    let mainApp = this.mainApp
    if (mainApp == null) {
      return this
    }
    return this.mainApp //
  }
  uuid() {
    return nanoid() //
  }
  createIdKey(type: string, config?: any) {
    let id = this.uuid()
    let key = `${type}_${id}`
    let obj = {
      id: id,
      key: key,
      type: type,
      style: {},
      options: config //
    }
    if (config == null) {
      delete obj.options
    }
    return obj
  }
  getTablePrimaryKey(tableName: string) {
    let tableInfo = this.getCompanyTable()
    //@ts-ignore//
    let table = tableInfo[tableName]
    return table
  }
  async getTableConfig(tableName: any) {
    let allTable = await this.getCompanyTable()
    return allTable[tableName] //
  }
  createFieldKey() {}
  async getDefaultPageLayout(tableName: string) {
    let allTable = await this.getCompanyTable() //
    //本地的表格
    let tableConfig = allTable[tableName]
    if (tableConfig == null) {
      // throw new errors.NotFound(`table ${tableName} not found`) ////
      return null //
    }
    let lastList: any[] = []
    let _node = {
      ...this.createIdKey('inline'),
      columns: [
        {
          ...this.createIdKey('grid'),
          options: {
            gutter: 0,
            justify: 'start',
            align: 'top'
          },
          style: {
            width: '100%'
          },
          columns: [
            {
              ...this.createIdKey('col'), //
              // list: [_.cloneDeep(node)],
              list: [
                {
                  ...this.createIdKey('inline'),
                  columns: lastList
                }
              ],
              options: {
                span: 24,
                offset: 0,
                push: 0,
                pull: 0,
                style: {}
              }
            }
          ]
        }
      ]
    }
    let config = {
      layout: {
        pc: [_node],

        mobile: [
          {
            columns: [],
            ...this.createIdKey('inline')
          }
        ]
      },
      fields: [
        {
          ...this.createIdKey('entity', tableConfig)
        }
      ],
      data: {},
      logic: {}
    }
    let pcLayout = config.layout.pc as any
    let res = lastList //
    let res1 = this.getLastNodeInLayout(config.layout.mobile)
    res[0] = config.fields[0].id //
    res1.forEach((item, i) => {
      let _field = config.fields[i]
      if (_field) {
        item.columns.push(_field.id) //
      }
    }) //
    return config //
  }
  getLastNodeInLayout(layout: any[], res: any[] = []) {
    layout.forEach(item => {
      if (item.type == 'inline') {
        let columns = item.columns
        if (columns.length == 0) {
          res.push(item)
        }
        return
      } else {
        let children = [...(item.list || []), ...(item.columns || []), ...(item.rows || [])]
        if (children.length > 0) {
          this.getLastNodeInLayout(children, res)
        }
      }
    })
    return res
  }
  getApiCaptcha(host: any, key: any, clear = false) {
    let cdata = this.captchaData
    let _value = cdata?.[host]?.[key]
    let _t = _value?.text
    return _t //
  }
  clearApiCaptcha(host: any, key: any) {
    let cdata = this.captchaData
    let _value = cdata?.[host]?.[key]
    if (_value) {
      cdata[host][key] = null
    } //
  }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application //
  return feathers //
}
