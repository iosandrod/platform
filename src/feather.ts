import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
import { createApp } from './app/app_index'
import knex, { Knex } from 'knex'
import { cacheValue } from './decoration'
import { nanoid } from './utils'
// const nanoid = () => 'xxxxx' //
export const subAppCreateMap = {
  erp: createApp //
}
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
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
      .toQuery()
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
      }
      console.log(appName, 'appName1231312321') //
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
  @cacheValue() //
  async getCompanyTable(companyid?: string, appName?: string) {
    let _connect = null
    if (companyid == null) {
      _connect = this.get('postgresqlClient')
    } else {
      _connect = await this.getCompanyConnection(companyid, appName) //
    }
    let sql = `SELECT 
   
		c.*,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN true
        ELSE false
    END AS is_primary_key
FROM 
    information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
    ON c.table_name = kcu.table_name
    AND c.column_name = kcu.column_name
    AND c.table_schema = kcu.table_schema
LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
    AND tc.constraint_type = 'PRIMARY KEY'
WHERE 
    c.table_schema = 'public'
ORDER BY 
    c.table_name, c.ordinal_position;`
    let sql1 = `SELECT 
    kcu.table_schema,
    kcu.table_name,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS primary_keys
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
GROUP BY 
    kcu.table_schema,
    kcu.table_name
ORDER BY 
    kcu.table_name;
`
    let allColumns = await _connect.raw(sql) //////
    allColumns = allColumns.rows
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
  }
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
  createFieldKey() {}
  async getDefaultPageLayout(tableName: string) {
    let allTable = await this.getCompanyTable()
    let tableConfig = allTable[tableName]
    let config = {
      layout: {
        pc: [
          {
            columns: [],
            ...this.createIdKey('inline'),
            style: {
              height: '100%' //
            }
          }
        ],
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
    let pcLayout = config.layout.pc
    let res = this.getLastNodeInLayout(pcLayout) //
    let res1 = this.getLastNodeInLayout(config.layout.mobile)
    res.forEach((item, i) => {
      let _field = config.fields[i]
      if (_field) {
        item.columns.push(_field.id)
      }
    })
    res1.forEach((item, i) => {
      let _field = config.fields[i]
      if (_field) {
        item.columns.push(_field.id) //
      }
    })
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
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application //
  return feathers //
}
