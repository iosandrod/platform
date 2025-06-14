import { Feathers } from '@feathersjs/feathers'
// import { Service } from '@feathersjs/feathers'
import { Application } from './declarations'
import { createApp } from './app/app_index'
import _ from 'lodash'
import knex, { Knex } from 'knex'
import { cacheValue } from './decoration'
import { createNodeGrid, nanoid } from './utils'
import { errors } from '@feathersjs/errors'
import { getDefaultEditPageLayout, getDefaultImportPageLayout, getDefaultPageLayout } from './layoutGetFn'
import { BaseService } from './services/base.service'
import { createMap, defaultServiceMethods } from './services'
import { columnToTable, createNewApp } from './featherFn'
import { channels } from './channels/channels'
// const nanoid = () => 'xxxxx' //
export const subAppCreateMap = {
  erp: createApp //
}
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
  publish(arg0: string, arg1: {}) {
    throw new Error('Method not implemented.')
  }
  subAppCreateMap = subAppCreateMap
  captchaData: any = {}
  mainApp?: myFeathers
  cache: { [key: string]: any } = {}
  cacheKnex: { [key: string]: Knex } = {}
  subApp: {
    [key: string]: Application
  } = {}
  constructor() {
    super()
    this.initCurrentHooks()
  }
  async getAllSubApp() {
    const services = this.services
  }
  async getAllCompany() {
    let companyService = this.service('company') //
    let company = await companyService.find({
      query: {
        userid: {
          //大于0
          $gt: 0
        }
      }
    }) //
    return company
  } //
  async createCompany(config: any) {
    let s1 = await this.createService({ serviceName: 'company1' }) //

    let appName = config.appName //
    let userid = config.userid //
    //创建数据库//
    if (userid == null) {
      throw new errors.BadRequest('用户不能为空') //
    }
    let companyS = this.service('company') //
    let query = {
      appName, //
      userid
    }
    let hasRows = await companyS.find({
      query
    })
    let tCompany = null
    if (hasRows.length == 0) {
      // throw new errors.BadRequest('公司已存在')
      let companies = await companyS.create({
        appName,
        userid
      })
      // hasRows=[...companies]
      tCompany = companies[0]
    } else {
      tCompany = hasRows[0]
    }
    let app = this
    let sql1 = `SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${appName}'
      AND pid <> pg_backend_pid();` //
    let pgClient = app.get('postgresqlClient') //

    await pgClient.raw(sql1)
    let _key = `${appName}_${userid}` //
    let sql = `CREATE DATABASE ${_key}
        WITH
        OWNER = postgres
        TEMPLATE = ${appName};` //
    //检查数据库是否存在
    let sql2 = `SELECT EXISTS(SELECT FROM pg_database WHERE datname = '${_key}');`
    let sql3 = `SELECT EXISTS(SELECT FROM pg_database WHERE datname = '${appName}');`
    let data = await pgClient.raw(sql2) //
    let data1 = await pgClient.raw(sql3) //
    let isExist = data.rows[0].exists //
    let isExist1 = data1.rows[0].exists //
    if (isExist1 == false) {
      throw new errors.BadRequest('不存在相关app')
    } //
    if (isExist == false) {
      await pgClient.raw(sql)
    }
    //添加相关的数据库
    let mainApp = this.getMainApp()
    //添加相关数据源的app
    let createMap = this.subAppCreateMap //
    //@ts-ignore
    let createFn = createMap[appName]
    if (typeof createFn !== 'function') {
      throw new errors.BadRequest('不存在相关app')
    } //
    //@ts-ignore
    let _app: myFeathers = await this.registerSubApp({ ...tCompany, ...config }) //
    let sers = _app.services //
    let alls: any[] = Object.values(sers)
    for (const s of alls) {
      // console.log(s,'testS')////
      let _s: BaseService = s
      if (typeof s.init === 'function') {
        await _s.init(_app as any) //
      }
    }
  } //
  @cacheValue() //
  async getRoles(userid: string) {
    // let client = this.getPgClient()
    // let sql = client('roles')
    //   .join('user_roles', 'roles.id', '=', 'user_roles.rolesId')
    //   .where('user_roles.usersId', userid)
    //   .select('roles.*')
    //   .toQuery() //
    // let data = await client.raw(sql)
    // let rows = data.rows
    // return rows //
    return [] //
  }
  getPgClient(): Knex {
    let c = this.get('postgresqlClient')
    return c
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
  async getCompanyConnection(company?: any, appName?: string): Promise<Knex> {
    let client = this.getClient()
    if (typeof company === 'number') {
      let cacheKnex = this.cacheKnex
      let _key = `${appName}--${company}`
      let _knex = cacheKnex[_key]
      if (_knex != null) {
        return _knex //
      }
      if (appName == null || company == null) {
        return this.getPgClient() //
      } //
      let companyInfo = await client('company')
        .where({
          userid: company, //
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
  })
  //获取所有的表结构
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
    if (_connect == null) {
      _connect = this.getPgClient() //
    }
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
ORDER BY 
    tbl.relname, cols.attnum;
`
    let allColumns = await _connect.raw(sql) //////
    allColumns = allColumns.rows //
    let tables = columnToTable(allColumns) //
    return tables //
  } //
  clearCache(fnName: string, key?: string) {
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
  async registerSubApp(config: any) {
    let appName = config.appName //
    let companyId = config.userid || config.companyid //
    //@ts-ignore
    const createFn = subAppCreateMap[appName] //
    let company = config.company
    if (typeof createFn !== 'function') return // 不存在的服务不需要注册
    //@ts-ignore
    let subApp = await createFn(this, config) //
    let key = `${appName}_${companyId}` //
    let routePath = `/${key}` //
    this.use(routePath, subApp)
    let subAppMap = this.subApp //
    //@ts-ignore
    subAppMap[key] = subApp
    let mainApp: any = this.getMainApp()
    let server = mainApp.server
    if (server) {
      console.log('server 已经初始化') //
      await subApp.setup(server)
      subApp.configure(channels) //
    }
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
      options: config || {} //
    }
    // if (config == null) {
    //   delete obj.options
    // }//
    return obj
  }
  getTablePrimaryKey(tableName: string) {
    //
    let tableInfo = this.getCompanyTable()
    //@ts-ignore//
    let table = tableInfo[tableName]
    return table
  }
  async getTableConfig(tableName: any) {
    let allTable = await this.getCompanyTable()
    return allTable[tableName] //
  } //
  createFieldKey() {}
  async getDefaultPageLayout(tableName: string) {
    //
    let obj = await getDefaultPageLayout(this, tableName)
    return obj
  }
  async getDefaultImportPageLayout(tableName: any, context: any) {
    let obj = await getDefaultImportPageLayout(this, tableName, context)
    return obj //
  }
  async getDefaultSearchPageLayout(tableName: any, params: any) {}
  async getDefaultEditPageLayout(tableName: string) {
    let obj = await getDefaultEditPageLayout(this, tableName)
    return obj
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
    return res //
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
  } //
  initCurrentHooks() {
    //
    this.hooks({
      all: [
        //
        async (context: any, next: any) => {
          //
          await next()
          let params = context.params || {}
          // let provider = params.provider
          // const service = context.service//
          // if (provider == 'socketio') {
          //   context.result = {
          //     data: context.result,
          //     code: 200
          //   } //
          // }
        }
      ]
    })
  }
  async initTableService() {
    let names: any[] = Object.keys(createMap) //
    let app = this
    let _names = await app.getCompanyTable()

    let allT = _names
    _names = Object.keys(_names) ////
    names = [...names, ..._names].filter((name, i) => {
      return name != null
    })
    names = names.filter((name, i) => names.indexOf(name) == i) //
    // let arr = []
    for (const name of names) {
      let isView = false
      let id = 'id'
      let ids = [] //
      let _t = allT[name]
      if (_t) {
        let _isView = _t.isView
        if (_isView == true) {
          isView = true
        }
        let primaryKey = _t.columns.filter((col: any) => col['is_primary_key'] == true)
        ids = primaryKey.map((col: any) => col['column_name'])
        // console.log(name, ids)//
        if (ids.length > 0) {
          let _key = primaryKey[0]['column_name']
          id = _key
        } else {
          console.log('表格没有主键字段', name, ids) ////
        }
      }
      let opt = {
        serviceName: name,
        id,
        ids,
        isView
      }
      await this.addService({ options: opt, serviceName: name }) //
    }
  }
  async addService(
    config: {
      options: {
        id: string
        ids: string[]
        serviceName: string
      }
      serviceName: string
    } & any
  ) {
    let _service = this.services[config.serviceName] //
    if (_service) {
      return //
    }
    let s = await this.createService(config)
    await s.initHooks(this) //
    //@ts-ignore
    s.init(this)
  } //
  async createService(config: any) {
    let serviceName = config.serviceName //
    let app = this
    //创建类
    let _class = BaseService
    let _options = config.options || {}
    let methods = defaultServiceMethods
    let Model = this.get('postgresqlClient')
    _.merge(_options, {
      methods,
      name: serviceName, //
      Model
    })
    let createClass = _class
    //@ts-ignore
    let _sClass = createMap[serviceName]
    if (_sClass) {
      //
      createClass = _sClass
    }
    let service = new createClass(_options) //
    service.serviceName = serviceName //服务名称
    return service
  }
  async initCurrentService() {
    let services = this.services
    let allS: any[] = Object.values(services)
    for (const s of allS) {
      await s.init(this) //
    }
    let subApp = this.subApp
    let allSApp = Object.entries(subApp)
    for (const [key, sApp] of allSApp) {
      sApp.initCurrentService() //
    }
  } //
  async getOptionsFieldSelect(fields: string[]) {
    if (!Array.isArray(fields) || fields.length == 0) {
      return {}
    }
    let ds = this.service('DataDictionary')
    // console.log(fields, 'testF') //
    let data = await ds.find({
      query: {
        DictionaryName: {
          //
          $in: fields //
        }
      }
    })
    let _arr: any[] = []
    data = data.filter((item: any) => {
      let sql = item.cDefine1
      if (sql?.length > 0) {
        _arr.push(item)
        return false
      }
      return true
    }) //
    let _arr1 = _arr.map((item: any) => {
      return item.DictionaryName
    })
    let obj: any = {}
    for (const item of _arr) {
      let sql = item.cDefine1 //
      let client = this.getPgClient()
      let data = await client.raw(sql)
      let rows = data.rows //
      let r0 = rows[0] || {}
      if (Object.keys(r0).includes('key')) {
        rows = rows.map((item: any) => {
          return {
            value: item.key,
            label: item.value //
          }
        })
      }
      let DictionaryName = item.DictionaryName
      obj[DictionaryName] = rows //
    }
    for (const f of fields) {
      if (_arr1.includes(f)) {
        continue //
      }
      obj[f] = data
        .filter((item: any) => item.DictionaryName == f) //
        .map((item: any) => {
          let value = item.DictionaryKey
          let label = item.DictionaryValue
          item.label = label
          item.value = value
          return item
        })
    } //
    return obj //
  }
  @cacheValue()
  async getRealServiceName(serviceName: string) {
    let sql = `select "realTableName" from  entity where "tableName"='${serviceName}'`
    let data = await this.getPgClient().raw(sql)
    let realTableName = data.rows?.[0]?.['realTableName']
    return realTableName
  }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application //
  return feathers //
}
