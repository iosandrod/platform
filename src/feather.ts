import {
  Feathers,
  FeathersService,
  getServiceOptions,
  protectedMethods,
  Service,
  ServiceInterface,
  ServiceOptions,
  wrapService
} from '@feathersjs/feathers'
import { stripSlashes } from '@feathersjs/commons'
import { Application } from './declarations'
// import { createApp } from './app/app_index'
import _ from 'lodash'
import knex, { Knex } from 'knex'
import { cacheValue } from './decoration'
import { createNodeGrid, nanoid } from './utils'
import { errors } from '@feathersjs/errors'
import { getDefaultEditPageLayout, getDefaultImportPageLayout, getDefaultPageLayout } from './layoutGetFn'
import { BaseService } from './services/base.service'
import { createMap, defaultServiceMethods } from './services'
import { columnToTable } from './featherFn'
import { channels } from './channels/channels'
import { options } from 'svg-captcha'
import { connect } from 'node:http2'
import { myAuth } from './auth'
import { configuration } from './config'
import { routing } from './socketio/routing'
import { configureSocketio } from './socketio'
// const nanoid = () => 'xxxxx' //
// export const subAppCreateMap = {
//   erp: createApp //
// }
//构建自己的feather
export class myFeathers extends Feathers<any, any> {
  knexInt: any
  publish(arg0: string, arg1: {}) {
    // throw new Error('Method not implemented.')
    return
  }
  // subAppCreateMap = subAppCreateMap
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
    let appName = config.appName //
    let userid = config.userid //
    if (userid == null) {
      throw new errors.BadRequest('用户不能为空') //
    }
    let companyS = this.service('company') //
    let query = {
      appName, //
      userid
    }
    let tCompany = null
    if (config.id && config.connection) {
      tCompany = config
    } else {
      let hasRows = await companyS.find({
        query
      })
      if (hasRows.length == 0) {
        throw new errors.BadRequest('没有相关的账套') //
      } else {
        tCompany = hasRows[0]
      }
    }

    let app = this
    let fromAppName = `${appName}_1`
    let sql1 = `SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${fromAppName}'
      AND pid <> pg_backend_pid();` //
    let pgClient = app.get('postgresqlClient') //

    await pgClient.raw(sql1)
    let _key = `${appName}_${userid}` //
    let sql = `CREATE DATABASE ${_key}
        WITH
        OWNER = postgres
        TEMPLATE = ${fromAppName};` //
    //检查数据库是否存在
    let sql2 = `SELECT EXISTS(SELECT FROM pg_database WHERE datname = '${_key}');`
    let sql3 = `SELECT EXISTS(SELECT FROM pg_database WHERE datname = '${appName}');`
    let data = await pgClient.raw(sql2) //
    let data1 = await pgClient.raw(sql3) //
    let isExist = data.rows[0].exists ////
    let isExist1 = data1.rows[0].exists //
    if (isExist1 == false) {
      throw new errors.BadRequest('不存在相关应用') //
    } //
    if (isExist == false) {
      await pgClient.raw(sql)
    }
    //添加相关的数据库
    let mainApp = this.getMainApp()
    //添加相关数据源的app
    // let createMap = this.subAppCreateMap //
    // //@ts-ignore
    // let createFn = createMap[appName]
    // if (typeof createFn !== 'function') {
    //   throw new errors.BadRequest('不存在相关app')
    // } //
    let subApps = this.get('subApps')
    if (!subApps.includes(appName)) {
      throw new errors.BadRequest('不存在相关应用') //
    }
    let k = await this.getCompanyConnection({ ...tCompany, ...config })
    //@ts-ignore
    let _app: myFeathers = await this.registerSubApp({ ...tCompany, ...config }) //
    let sers = _app.services //
    let alls: any[] = Object.values(sers)
    for (const s of alls) {
      let _s: BaseService = s
      if (typeof s.init === 'function') {
        await _s.init(_app as any) //
      }
    }
  }
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
  getUser(context: any) {
    if (context?.params == null) {
      context = {
        params: context //
      }
    }
    let id = context?.params?.user
    let authenticationId = context?.params?.authentication?.user
    if (id == null) {
      id = authenticationId
    }
    if (id == null) {
      return null //
    }
    return id //
  }
  getUserId(context: any) {
    if (context?.params == null) {
      context = {
        params: context //
      }
    }
    let id = context?.params?.user?.id
    let authenticationId = context?.params?.authentication?.user?.id
    if (id == null) {
      id = authenticationId
    }
    if (id == null) {
    }
    return id //
  }
  @cacheValue()
  getUserPermissions(userid: string) {
    let roles = this.getRoles(userid)
  }
  async getAllApp() {} //
  async getCurrentTable() {}
  async getDefaultAppConnection(config: any) {
    let _this = this
    if (!_this.getIsMain()) {
      _this = _this.getMainApp() as any //
    }
    let appName = config?.appName
    if (typeof config === 'string') {
      config = { appName: config }
      appName = config.appName
    } //
    let cacheKnex = _this.cacheKnex
    let _knex = cacheKnex[appName]
    if (_knex != null) {
      return _knex
    }
    // let defaultConnection = process.env.postgresql_connection_default
    // let _connection = `${defaultConnection}/${appName}`
    let _connection = this.getLocalDefaultConnection(appName, config?.userid)
    let client = _this.getClientType()
    let obj = {
      client: client,
      connection: _connection
    }
    // console.log(obj, 'testObj') //
    let knex1 = knex(obj)
    await knex1.raw('SELECT 1') //
    cacheKnex[appName] = knex1
    return knex1 //
  }
  //@ts-ignore
  async getCompanyConnection(config?: any): Promise<Knex> {
    if (!this.getIsMain()) {
      let main = this.getMainApp() as any
      if (config == null) {
        let _config = {
          appName: this.getAppName(),
          companyid: this.getCompanyId()
        }
        config = _config
      } //
      return await main.getCompanyConnection(config) //
    }
    let { company, appName, companyid, userid } = config
    company = company || companyid || userid //
    let client = this.getClient()
    if (company != null && appName != null) {
      //
      let cacheKnex = this.cacheKnex
      let _key = `${appName}--${company}`
      let _knex = cacheKnex[_key]
      if (_knex != null) {
        return _knex //
      }
      if (appName == null || company == null) {
        return this.getPgClient() //
      } //
      let row = null
      if (config.connection && config.id) {
        row = config
      } else {
        let companyInfo = await client('company')
          .where({
            userid: company, //
            appName: appName
          })
          .select() ////
        row = companyInfo[0]
      }
      if (row == null) {
        throw new Error(`company ${company} not found`) //
      }
      // let connection = companyInfo[0].connection //
      // let type = companyInfo[0].type //
      let connection = row.connection //
      let type = row.type //
      let obj = {
        client: type,
        connection: connection
      }
      // console.log(obj) //
      let _client = knex(obj)
      cacheKnex[_key] = _client ////
      return _client
    }
    if (typeof company == 'object') {
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
  @cacheValue((config: any) => {
    // if (companyid == null) {
    //   companyid = '' //
    // }
    // if (appName == null) {
    //   appName = ''
    // }
    // return `${companyid}--${appName}`
    config = config || {}
    let { companyid, appName } = config //
    if (companyid == null) {
      companyid = '' //
    }
    if (appName == null) {
      appName = ''
    }
    return `${companyid}--${appName}`
  }) //
  //获取所有的表结构
  // async getCompanyTable(companyid?: string, appName?: string) {
  async getCompanyTable(config?: any): Promise<any> {
    let mainApp = this.getMainApp()
    if (mainApp != this) {
      let appName = config?.appName || this.get('appName')
      let companyid = config?.companyid || this.get('companyid')
      //@ts-ignore
      let _t = await mainApp.getCompanyTable({ ...config, appName, companyid })
      return _t
    } //
    let { companyid, appName } = config || {}
    //@ts-ignore
    let _this: myFeathers = this.getMainApp()
    //@ts-ignore
    let _connect: Knex = null
    if (companyid == null) {
      _connect = this.get('postgresqlClient')
    } else {
      _connect = await _this.getCompanyConnection({ ...(config || {}), company: companyid, appName })
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
  getStaticCompanyTable() {
    let isMain = this.getIsMain()
    if (isMain) {
      let cache = this.cache
      let key = 'getCompanyTable----'
      return cache[key]
    } else {
      let mainApp: any = this.getMainApp()
      let appName = this.get('appName')
      let companyid = this.get('companyid')
      let cache = mainApp.cache
      let key = `getCompanyTable--${companyid}--${appName}`
      return cache[key] //
    }
  }
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
  async createSubApp(config: any, mainApp: any): Promise<myFeathers> {
    const app1 = createFeathers() //
    let companyId = config.userid || config.companyid
    const app = app1
    let appName = config.appName //
    //@ts-ignore
    app.mainApp = mainApp //
    app.set('appName', appName) //
    app.set('companyid', companyId) //公司ID就是用户ID
    // app.configure(configuration()) //
    await app.initDefaultConfig() //
    // app.configure(routing()) //设置路由和认证相关的
    await app.initRouteClass() //
    //前台需要知道用户的角色和ID才可以进行操作
    await app.initKnexClient(config)
    await app.initTableService() //
    await app.initAuth() //
    await app.initAppSocket()
    // app.configure(appAuthenticate) //设置认证
    // let fn = configureSocketio({ cors: { origin: app.get('origins') }, namespace: `erp_${companyId}` })
    // await fn(app) //
    return app
  }
  async registerSubApp(config: any) {
    let appName = config.appName //
    let companyId = config.userid || config.companyid //
    //@ts-ignore
    // const createFn = subAppCreateMap[appName] //
    // let company = config.company
    let subApps = this.get('subApps')
    if (!subApps.includes(appName)) {
      return
    }
    let subApp = await this.createSubApp(config, this.getMainApp()!) //

    //前置路由
    let key = `${appName}_${companyId}` //
    subApp.set('prefix', key)
    let routePath = `/${key}` //
    this.use(routePath, subApp as any)
    let subAppMap = this.subApp //
    //@ts-ignore
    subAppMap[key] = subApp
    let mainApp: any = this.getMainApp()
    let server = mainApp.server
    if (server) {
      console.log('server 已经初始化') //
      //@ts-ignore
      await subApp.setup(server)
      subApp.configure(channels) //
    }
    return subApp
  }
  getMainApp() {
    //
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
        async (context: any, next: any) => {
          //
          await next()
          let params = context.params || {} //
        }
      ]
    })
  }
  getAddOptions(name: string, allT: any) {
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
        // console.log('表格没有主键字段', name, ids) ////
      }
    }
    let opt = {
      serviceName: name,
      id,
      ids,
      isView
    }
    return opt //
  }
  // lookup(path:any) {
  //   console.log('执行到这了')//
  //   let _this:any=this
  //   const result = _this.routes.lookup(path)
  //   if (result === null) {
  //     return null
  //   }
  //   const {
  //     params: colonParams,
  //     //@ts-ignore
  //     data: { service, params: dataParams }
  //   } = result

  //   const params = dataParams ? { ...dataParams, ...colonParams } : colonParams

  //   return { service, params }
  // }
  service<L extends string>(location: L): FeathersService<this, Service> {
    let path = (stripSlashes(location) || '/') as L
    let current = this.services.hasOwnProperty(path) ? this.services[path] : undefined
    // let allTable=this.getCompanyTable()
    let allTable = this.cache['getCompanyTable----']
    // console.log(Object.keys(this.cache),'testTable')//
    if (typeof current === 'undefined') {
      if (allTable != null && allTable[path] != null) {
        let targetTable = allTable[path]
        if (targetTable != null) {
          let opt = this.getAddOptions(path, allTable)
          current = this.addService({
            //
            options: opt,
            serviceName: path //
          })
          this.services[path] = current //
        }
        return current //
      } else {
        //
        this.use(path, this.defaultService(path) as any)
      }
      // return this.service(path) //
    } //
    return current as any
  }
  defaultService(location: string): ServiceInterface {
    throw new Error(`Can not find service '${location}'`)
  }
  async initTableService() {
    let names: any[] = Object.keys(createMap) ////
    let app = this
    let _names = await app.getCompanyTable()
    let allT = _names
    _names = Object.keys(_names) ////
    names = [...names, ..._names].filter((name, i) => {
      return name != null
    })
    names = names.filter((name, i) => names.indexOf(name) == i)
  } //
  getIsMain() {
    let a = this.getMainApp()
    if (a == this) {
      return true
    }
    return false
  }
  getAllTableName() {
    let staticTableName = this.getStaticCompanyTable()
    // console.log('就是浪费时间龙口粉丝进啦', staticTableName)//
    let names = Object.keys(staticTableName)
    let createNames = Object.keys(createMap)
    names = [...names, ...createNames]
    return names
  }
  addService(
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
    // let options = config.options
    // // console.log(options)
    // options.name = options.name || config.serviceName //
    let s = this.createService(config) //
    s.initHooks(this) //
    //@ts-ignore
    s.init(this)
    return s //
  } //
  createService(config: any) {
    let serviceName = config.serviceName //
    let app = this
    //创建类
    let _class = BaseService
    let _options = config.options || {}
    let methods = defaultServiceMethods
    let Model = this.get('postgresqlClient')
    // console.log(config.options)
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
    // console.log(Object.keys(_options))//
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
    let _fields = fields.map((item: any) => {
      return `'${item}'` //
    })
    let ds = this.service('DataDictionary')
    // console.log(fields, 'testF') //
    let data = await ds.find({
      query: {
        DictionaryName: {
          $in: fields //
        }
      }
    })
    // console.log(data, 'testD') //
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
      let data: any = {
        rows: []
      }
      try {
        // data = await client.raw(sql) //
      } catch (error) {}
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
  use<L extends keyof any & string>(
    path: L,
    service: keyof any extends keyof any ? ServiceInterface | Application : any[L],
    options?: ServiceOptions<keyof any extends keyof any ? string : keyof any[L]>
  ): this {
    if (typeof path !== 'string') {
      throw new Error(`'${path}' is not a valid service path.`)
    } //
    let location = (stripSlashes(path) || '/') as L
    let subApp = service as Application
    let isSubApp = typeof subApp.service === 'function' && subApp.services

    if (isSubApp) {
      Object.keys(subApp.services).forEach(subPath =>
        this.use(`${location}/${subPath}` as any, subApp.service(subPath) as any)
      )

      return this
    }

    let protoService = wrapService(location, service, options as ServiceOptions)
    let serviceOptions: any = getServiceOptions(protoService)

    for (const name of protectedMethods) {
      if (serviceOptions.methods.includes(name)) {
        throw new Error(`'${name}' on service '${location}' is not allowed as a custom method name`)
      }
    }

    // Add all the mixins
    this.mixins.forEach(fn => fn.call(this, protoService, location, serviceOptions))

    this.services[location] = protoService

    // If we ran setup already, set this service up explicitly, this will not `await`
    if (this._isSetup && typeof protoService.setup === 'function') {
      protoService.setup(this, location)
    }

    return this
  }
  getMainDefaultConnection() {
    let NODE_ENV: any = process.env.NODE_ENV
    let _config = this.get(NODE_ENV)
    let pgconnection = _config?.['pgconnection']
    return pgconnection //
  }
  getLocalDefaultConnection(appName: string, userid?: any) {
    let NODE_ENV: any = process.env.NODE_ENV
    let _config = this.get(NODE_ENV)
    let _config1 = _config?.[appName] || {}
    let pgconnection = _config1?.['pgconnection']
    let _name = `${appName}`
    if (userid != null) {
      _name = `${_name}_${userid}`
    }
    let c = `${pgconnection}/${_name}`
    return c
  }
  async initKnexClient(config: any) {
    if (config.client == null) config.client = this.getClientType() //
    let isMain = this.getIsMain() //
    let pool = config.pool
    if (pool == null) {
      pool = {
        min: 2,
        max: 50,
        idleTimeoutMillis: 30000
      }
      config.pool = pool
    }
    let isLocal = process.env.NODE_ENV == 'development'
    let node_env: any = process.env.NODE_ENV
    let _config = this.get(node_env)
    if (isMain) {
      // if (isLocal) {
      //   config.connection = this.get('')
      // }
      // config.connection = _config?.['platform']?.['pgconnection']
      let _pConfig = this.getLocalDefaultConnection('platform')
      config.connection = _pConfig
      let db = knex(config) //
      await db.raw('SET TIME ZONE "Asia/Shanghai"')
      this.set('postgresqlClient', db)
    } else {
      let companyid = this.get('companyid')
      let appName = this.get('appName')
      let mainApp = this.getMainApp()!
      // let _appConfig = mainApp.get(node_env)?.[appName]?.['pgconnection']
      let _appConfig = mainApp.getLocalDefaultConnection(appName, companyid)
      // config.connection = `${_appConfig}/${appName}_${companyid}` //
      config.connection = `${_appConfig}` //
      let db = knex(config)
      await db.raw('SET TIME ZONE "Asia/Shanghai"')
      this.set('postgresqlClient', db)
      mainApp?.set(`postgresqlClient_${companyid}_${appName}`, db)
    } //
    let db = this.get('postgresqlClient')
    if (db) {
      // this.knexInt = setInterval(() => {
      //   db.raw('SELECT 1') //
      // }, 3000)
    }
  }
  async initAuth() {
    let s = new myAuth(this, 'authentication', {})
    this.use('authentication', s) //
  }
  async initDefaultConfig() {
    configuration(this as any) //
  }
  async initRouteClass() {
    //
    routing()(this as any)
  }
  async initAppSocket() {
    let appName = this.get('appName')
    let companyId = this.get('companyid')
    let fn = configureSocketio({
      cors: { origin: this.get('origins') },
      namespace: `${appName}_${companyId}`
    })
    await fn(this as any)
  }
  getClientType() {
    return 'pg'
  }
  getAppName() {
    return this.get('appName')
  } //
  getCompanyId() {
    return this.get('companyid')
  }
  async checkIsAdmin(params: any) {
    let userid = this.getUserId(params) //
    console.log(userid, 'testId') //
    if (userid == 1) {
      return true
    }
    return false //
  }
}
export const createFeathers = () => {
  //@ts-ignore
  const feathers = new myFeathers() as Application //
  return feathers //
}
