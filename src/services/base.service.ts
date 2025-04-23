import { errorHandler, KnexAdapterOptions, KnexAdapterParams, KnexService, transaction } from '@feathersjs/knex'
import { Knex } from 'knex'
import { Application, HookContext } from '../declarations'
import { _authenticate, cacheValue, routeConfig, useHook } from '../decoration'
import { typeMap } from './validate/typeMap'
import { AdapterQuery } from '@feathersjs/adapter-commons'
import { ServiceParams } from '@feathersjs/transport-commons/lib/http'
import _, { result } from 'lodash'

//@ts-ignore
import { format } from '@scaleleap/pg-format'
import { defaultServiceMethods, Paginated, Params } from '@feathersjs/feathers'
import { TObject, TPick, Type } from '@feathersjs/typebox'
import Ajv, { ValidateFunction } from 'ajv'
import { addFormats } from '@feathersjs/schema'
//如何处理枚举类型
const RETURNING_CLIENTS = ['postgresql', 'pg', 'oracledb', 'mssql', 'sqlite3']

export type columnInfo = Partial<Knex.ColumnInfo & { field: string }>
import { hooks } from '@feathersjs/hooks'
import { myFeathers } from '../feather'
import { _auth } from '../auth'//
import Redis, { Result } from 'ioredis'
import { errors } from '@feathersjs/errors'
interface bs {
  hooksMetaData: any[]
}
//@ts-ignore
export class BaseService extends KnexService implements bs {
  ids?: string[]//
  cache: { [key: string]: any } = {}
  serviceName?: string //
  // hooksMetaData?: any[]
  transformMetaData?: any
  vSchema?: ValidateFunction
  totalSchema?: TObject
  pickSchame?: TPick<any, any>
  constructor(options: any) {
    super(options)//
    let metaData = this.hooksMetaData
    if (metaData == null) {
      this.hooksMetaData = []
      metaData = this.hooksMetaData //
    }
    let _this: any = this
    let r = this.routes || []
    let dMethods = [...defaultServiceMethods, ...r.map(r => r.path)]
    dMethods = dMethods.filter(
      (v, i) => dMethods.indexOf(v) == i //
    )
    let _hook = dMethods.reduce((result: any, item: any) => {
      //需要校验用户
      let unAuthMethods = _this['unAuthMethods'] || []
      //设置需要权限//
      if (
        ['create', 'update', 'patch', 'remove'].includes(item) && //
        !unAuthMethods.includes(item)
      ) {
        result[item] = [
          _authenticate('jwt'), //
          async (context: HookContext, next: any) => {
            const params = context.params
            //如果没有登陆
            if (params.authenticated != true) {
              await next()
              return
            }
            let user = params.user //
            if (user == null) {
              await next() //
              return //
            }
            let id = user.id
            let app: myFeathers = context.app //
            let roles = await app.getRoles(id) //
            params.roles = roles
            await next()
          },
          //开启事务
          //@ts-ignore
          async (context: HookContext, next: any) => {
            try {
              console.log('开启了事务了')
              await transaction.start()(context)
              await next()
              console.log('结束了事务')
              await transaction.end()(context)
            } catch (err) {//
              console.log('回滚了事务了')////
              await transaction.rollback()(context)
              throw err
            }
          }
          //@ts-ignore
        ]
      } //
      if (item == 'create') {//
      }
      return result
    }, {})
    this.hooksMetaData?.push(_hook)
    return this
  }
  app: myFeathers //
  routes?: routeConfig[] //
  columns: string[] = []
  columnInfo: columnInfo[] = []
  async init(mainApp?: Application) {
    //@ts-ignore
    this.app = mainApp
    const Model = this.Model
    let table = Model(this.options.name) //
    let columns = await table.columnInfo()
    const allColumnName = Object.keys(columns)
    // console.log(allColumnName)//
    this.columns = allColumnName
    this.columnInfo = Object.entries(columns).map(([key, value]) => {
      let _value = { ...value, field: key }
      return _value
    }) //设置
    //构建校验
    await this.buildDbSchema()
  }
  //@ts-ignore
  db(params?: ServiceParams): Knex {
    const { Model, name, schema, tableOptions } = this.getOptions(params)
    //@ts-ignore
    if (params && params.transaction && params.transaction.trx) {
      //@ts-ignore
      const { trx } = params.transaction
      // debug('ran %s with transaction %s', fullName, id)
      return schema ? (trx.withSchema(schema).table(name) as Knex.QueryBuilder) : trx(name)
    }
    //@ts-ignore
    return schema ? (Model.withSchema(schema).table(name) as Knex.QueryBuilder) : Model(name, tableOptions)
  }
  //类型校验
  async validate(data: any, params: Params) {
    //必录入校验
    let vSchema = this.vSchema!
    await vSchema(data)
    const errors = vSchema.errors || []
    return errors //
  }
  async create(data: any, params?: any): Promise<any> {
    let idCreate = await this.getDefaultIncreate()
    //获取数据库的字段
    if (Array.isArray(data)) {
      let result = await this.multiCraete(data, params)
      return result
    }
    if (idCreate == false) {
      let maxId = await this.getMaxId()//
      if (typeof maxId == 'string') {
        maxId = Number(maxId) + 1
      } else {
        maxId = maxId + 1//
      }
      let id = this.id
      data[id] = maxId////
    }
    const columns = this.columns
    const resolveData = Object.entries(data).reduce((result: any, [key, value]) => {
      if (columns.includes(key)) {
        result[key] = value
      } //
      return result
    }, {}) //
    //@ts-ignore
    let vResult = await this.validate(resolveData, params) //
    if (vResult?.length! > 0) {
      let fError = vResult[0]
      throw new Error(`数据校验出错,出错信息${JSON.stringify(fError)}`) //
    }
    const _res = await this._create(resolveData, params) //
    let targetRow = _res.rows[0]
    let _relateData = data['_relateData']//关联数据
    if (_relateData != null && typeof _relateData == 'object') {
      for (const [key, object] of Object.entries(_relateData)) {
        let dTableName = key//子表表名
        let _obj = object as any
        let data = _obj.data || []
        let required = _obj.required//是否必须有数据
        if (data.length == 0 && required == true) {
          throw new errors.BadRequest(`子表${dTableName}必须有数据`)//
        }
        await this._createDetailData({ data: data, mainRow: targetRow, tableName: dTableName }, params)//
      }
    }
    return _res //
    // return vResult
  }
  async _createDetailData(config: { data: any[], mainRow: any, tableName?: string, relateKey?: string, relateMainKey?: string }, params: any) {
    let tableName = config.tableName
    if (tableName == null) {
      throw new errors.BadRequest('子表表名不能为空')
    }
    let data: any[] = config.data
    let mainRow = config.mainRow
    let relateKey = config.relateKey
    let relateMainKey = config.relateMainKey
    let s: BaseService = this.app.service(tableName) as any
    if (s == null) {
      throw new errors.BadRequest('子表服务不存在')
    }
    if (relateKey == null) {
      relateKey = s.getPrimiaryKey()
    }
    if (relateMainKey == null) {
      relateMainKey = this.getPrimiaryKey()
    }
    let arr1 = []
    for (const dRow of data) {
      dRow[relateKey] = mainRow[relateMainKey]//
      let _res = await s.create(dRow, params)//
      arr1.push(_res)//
    }
    return arr1//
  }//
  getRedisClient(): Redis {
    let app = this.app
    let redisClient = app.get('redisClient')//
    return redisClient
  }
  getCompanyId() {
    let app = this.app
    let companyid = app.get('companyid')
    return companyid//
  }
  getAppName() {
    let app = this.app
    let appName = app.get('appName')
    return appName//
  }
  async getMaxId() {
    let id = this.id
    let serviceName = this.serviceName
    let sql = `SELECT MAX("${id}") AS max_id FROM "${serviceName}";`
    let data = await this.getModel().raw(sql)
    let _id = data.rows[0]['max_id']
    return _id
  }
  //判断是否自增
  @cacheValue()
  async getDefaultIncreate() {
    let id = this.id
    let schema = this.serviceName
    let sql = `SELECT *
FROM information_schema.columns
WHERE table_name = '${schema}'
  AND column_name = '${id}';`
    let client = this.getModel()
    let d = await client.raw(sql)
    // console.log(d)
    let reg = /^nextval\('([a-zA-Z0-9_\.]+)'::regclass\)$/
    if (reg.test(d)) {
      return true
    }
    return false
  }
  //使用事务
  //@ts-ignore
  async _create(_data: any, _params: ServiceParams = {} as ServiceParams) {
    let data = _data as any
    const params = _params as KnexAdapterParams
    //@ts-ignore
    const { client } = this.db(params)//
    const returning = RETURNING_CLIENTS.includes(client.driverName) ? [this.id] : []
    //@ts-ignore    //
    const query: any = await this.db(params)
      .insert(data, ['*'], { includeTriggerModifications: true })//
      .toQuery()
    let _rows = null
    try {//
      //@ts-ignore
      let _model = await this.db(params)
      // debugger//
      let rows = await _model.raw(query)
      _rows = rows
    } catch (error: any) {
      throw new errors.BadRequest(`插入数据失败${query},${error?.message || ''}`, {})//
    }
    _rows.sql = query//
    return _rows //
  }
  //@ts-ignore
  async find(...args) {
    // console.log([...args])//
    return await super.find(...args)
  }
  async multiCraete(data: any, params?: any) { }
  async buildDbSchema() {
    const columnInfo = this.columnInfo
    const schema = columnInfo.reduce((result: any, item) => {
      let field = item.field!
      let type = item.type as keyof typeof typeMap
      let nullable = item.nullable
      let _obj1 = typeMap[type] //构建校验的函数//
      let _obj = null
      if (nullable == true || (this.id == field && typeof _obj1 == 'function')) {
        try {
          _obj = Type.Optional(_obj1())
        } catch (error) {
          //@ts-ignore
          console.log('字段类型没有映射', this.options.name, item.field, item.type)
        }
      } else {
        if (typeof _obj1 != 'function') {
          //@ts-ignore
          console.log('字段类型没有函数映射', this.options.name, item.field, item.type)
          return result
        } //
        _obj = _obj1()
      }
      result[field] = _obj //
      return result
    }, {})
    // console.log(schema)
    this.totalSchema = Type.Object(schema) //
    let aj = new Ajv()
    let formatArr = [
      'date-time',
      'time',
      'date',
      'email',
      'hostname',
      'ipv4',
      'ipv6',
      'uri',
      'uri-reference',
      'uuid',
      'uri-template',
      'json-pointer',
      'relative-json-pointer',
      'regex'
    ]
    let validate = addFormats(aj, formatArr as any)
    let vSchema = validate.compile(this.totalSchema) //
    this.vSchema = vSchema
    //@ts-ignore
  }
  getPrimiaryKey(params: any = {}) {
    let ids = this.ids
    return this.id
  }
  getModel(params: any = {}) {
    const { Model } = this.getOptions(params)
    return Model
  }
  //@ts-ignore
  getOptions(params: any): KnexAdapterOptions {
    const paginate = params.paginate !== undefined ? params.paginate : this.options.paginate
    return {
      ...this.options,
      paginate,
      ...params.adapter
    }
  }
  //@ts-ignore
  async _find(params: ServiceParams = {} as ServiceParams): Promise<Paginated<any> | any[]> {
    //@ts-ignore
    const { filters, paginate } = this.filterQuery(params)
    //@ts-ignore
    const { name, id } = this.getOptions(params)
    //@ts-ignore
    const builder = params.knex ? params.knex.clone() : this.createQuery(params)
    const countBuilder = builder.clone().clearSelect().clearOrder().count(`${name}.${id} as total`)

    // Handle $limit//
    if (filters.$limit) {
      builder.limit(filters.$limit)
    }//

    // Handle $skip
    if (filters.$skip) {
      builder.offset(filters.$skip)
    }

    // provide default sorting if its not set
    if (!filters.$sort && builder.client.driverName === 'mssql') {
      builder.orderBy(`${name}.${id}`, 'asc')
    }

    const data = filters.$limit === 0 ? [] : await builder.catch(errorHandler)

    if (paginate && paginate.default) {
      //@ts-ignore
      const total = await countBuilder.then(count => parseInt(count[0] ? count[0].total : 0)) //
      return {
        total,
        limit: filters.$limit,
        skip: filters.$skip || 0,
        data
      }
    }
    return data
  }
}
