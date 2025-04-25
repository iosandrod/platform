import {
  errorHandler,
  KnexAdapterOptions,
  KnexAdapterParams,
  KnexService,
  transaction
} from '@feathersjs/knex'
import knex, { Knex, QueryBuilder } from 'knex'
import { Application, HookContext } from '../declarations'
import { _authenticate, cacheValue, routeConfig, useHook } from '../decoration'
import { typeMap } from './validate/typeMap'
import { AdapterQuery } from '@feathersjs/adapter-commons'
import { ServiceParams } from '@feathersjs/transport-commons/lib/http'
import _, { result } from 'lodash'

//@ts-ignore
import { format } from '@scaleleap/pg-format'
import { defaultServiceMethods, Id, NullableId, Paginated, Params } from '@feathersjs/feathers'
import { TObject, TPick, Type } from '@feathersjs/typebox'
import Ajv, { ValidateFunction } from 'ajv'
import { addFormats } from '@feathersjs/schema'
//如何处理枚举类型
const RETURNING_CLIENTS = ['postgresql', 'pg', 'oracledb', 'mssql', 'sqlite3']

export type columnInfo = Partial<Knex.ColumnInfo & { field: string }>
import { hooks } from '@feathersjs/hooks'
import { myFeathers } from '../feather'
import { _auth } from '../auth' //
import Redis, { Result } from 'ioredis'
import { errors } from '@feathersjs/errors'
const parse = (value: any) => (typeof value !== 'undefined' ? parseInt(value, 10) : value)
interface bs {
  hooksMetaData: any[]
}
const OPERATORS = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $like: 'like',
  $notlike: 'not like',
  $ilike: 'ilike'
}
const METHODS = {
  $ne: 'whereNot',
  $in: 'whereIn',
  $nin: 'whereNotIn',
  $or: 'orWhere',
  $and: 'andWhere'
}
//@ts-ignore
export class BaseService extends KnexService implements bs {
  _ajvInstance?: Ajv
  ids?: string[] //
  cache: { [key: string]: any } = {}
  serviceName?: string //
  transformMetaData?: any
  vSchema?: ValidateFunction
  totalSchema?: TObject
  pickSchame?: TPick<any, any>
  constructor(options: any) {
    super(options) //
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
      let _arr: any[] = []
      result[item] = _arr
      let unAuthMethods = _this['unAuthMethods'] || []
      //设置需要权限//
      if (
        ['create', 'update', 'patch', 'remove'].includes(item) && //
        !unAuthMethods.includes(item)
      ) {
        let arr1 = [
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
          }
          //开启事务
        ]
        _arr.push(...arr1)
      }
      //开启事务
      if (['create', 'update', 'patch', 'remove'].includes(item)) {
        _arr.push(async (context: HookContext, next: any) => {
          try {
            await transaction.start()(context)
            await next()
            await transaction.end()(context)
          } catch (err) {
            //
            await transaction.rollback()(context)
            throw err
          }
        }) //
      }
      //@ts-ignore
      _arr.unshift(async (context, next) => {
        await next()
        let params = context.params || {}
      })
      return result
    }, {})
    this.hooksMetaData?.push(_hook)
    return this
  }
  app: myFeathers //
  routes?: routeConfig[] //
  columns: string[] = [] //
  columnInfo: columnInfo[] = []
  getCompanyName() {}
  //@ts-ignore
  createQuery(params: ServiceParams = {} as ServiceParams) {
    const { name, id } = this.getOptions(params)
    //@ts-ignore
    const { filters, query } = this.filterQuery(params) //
    //@ts-ignore
    const builder = this.db(params).table(this.serviceName) //
    // $select uses a specific find syntax, so it has to come first.
    if (filters.$select) {
      const select = filters.$select.map(column => (column.includes('.') ? column : `${name}.${column}`))
      // always select the id field, but make sure we only select it once
      builder.select(...new Set([...select, `${name}.${id}`]))
    } else {
      builder.select(`${name}.*`)
    }
    //@ts-ignore
    // build up the knex query out of the query params, include $and and $or filters
    this.knexify(builder, {
      ...query,
      ..._.pick(filters, '$and', '$or')
    })

    // Handle $sort
    if (filters.$sort) {
      return Object.keys(filters.$sort).reduce(
        //@ts-ignore
        (currentQuery, key) => currentQuery.orderBy(key, filters.$sort[key] === 1 ? 'asc' : 'desc'),
        builder
      )
    }
    return builder
  }
  async init(mainApp?: Application) {
    //
    //@ts-ignore
    this.app = mainApp
    const Model = this.Model
    let appName = this.getAppName()
    let companyid = this.getCompanyId()
    let allT = await this.app.getCompanyTable(companyid, appName) //
    let columns = allT[this.serviceName!]?.columns || []
    if (columns.length == 0) {
      console.log(this.serviceName, '表不存在', this.app.get('appName')) // //
    }
    const allColumnName = columns.map((col: any) => col.field) //
    this.columns = allColumnName //
    this.columnInfo = columns ////
    //构建校验
    await this.buildDbSchema()
  }
  //@ts-ignore
  db(params?: ServiceParams): Knex {
    const { Model, name, schema, tableOptions } = this.getOptions(params)
    //@ts-ignore
    if (params && params.transaction && params.transaction.trx) {
      //@ts-ignore
      // let _t: Knex.Transaction = params.transaction
      //@ts-ignore
      const { trx } = params.transaction //
      // return trx.table(table)//
      return trx
    }
    //@ts-ignore
    return Model //
    // return schema ? (Model.withSchema(schema).table(name) as Knex.QueryBuilder) : Model(name, tableOptions)
  }
  //类型校验
  async validate(data: any, params: Params) {
    //必录入校验
    let vSchema = this.vSchema!
    if (vSchema == null) {
      await this.buildDbSchema() //
      vSchema = this.vSchema! //
    }
    await vSchema(data)
    const errors = vSchema.errors || []
    return errors //
  }
  async formatData(data: any) {
    let columnInfo = this.columnInfo
    const resolveData = Object.entries(data).reduce((result: any, [key, value]) => {
      let tCol = columnInfo.find(item => item.field == key)
      if (tCol) {
        let type = tCol.type
        if (type == 'jsonb' || type == 'json') {
          if (typeof value == 'object') {
            value = JSON.stringify(value)
          }
        }
        result[key] = value
      } //
      return result
    }, {}) //
    return resolveData
  }
  async create(data: any, params?: any): Promise<any> {
    //
    if (typeof params?.getMainParam == 'function') {
      params = params.getMainParam()
    } //
    let idCreate = await this.getDefaultIncreate()
    //获取数据库的字段
    if (Array.isArray(data)) {
      //批量新增
      let result = await this.multiCreate(data, params)
      return result
    }
    if (idCreate == false) {
      let maxId = await this.getMaxId(params) //
      let id = this.id
      data[id] = maxId ////
    }
    const resolveData = await this.formatData(data) //
    //@ts-ignore
    let vResult = await this.validate(resolveData, params) //
    if (vResult?.length! > 0) {
      let fError = vResult[0]
      throw new Error(`数据校验出错,出错信息${JSON.stringify(fError)}`) //
    }
    const _res = await this._create(resolveData, params) ////
    let targetRow = _res.rows[0]
    let _relateData = data['_relateData'] //关联数据
    if (_relateData != null && typeof _relateData == 'object') {
      for (const [key, object] of Object.entries(_relateData)) {
        let dTableName = key //子表表名
        let _obj = object as any
        let data = _obj.data || []
        let required = _obj.required //是否必须有数据
        if (data.length == 0 && required == true) {
          throw new errors.BadRequest(`子表${dTableName}必须有数据`) //
        }
        await this._createDetailData({ data: data, mainRow: targetRow, tableName: dTableName }, params) //
      }
    }
    return _res //
    // return vResult
  }
  async _createDetailData(
    config: { data: any[]; mainRow: any; tableName?: string; relateKey?: string; relateMainKey?: string },
    params: any
  ) {
    let tableName = config.tableName
    if (tableName == null) {
      throw new errors.BadRequest('子表表名不能为空')
    }
    let data: any[] = config.data
    let mainRow = config.mainRow
    let relateKey = config.relateKey
    let relateMainKey = config.relateMainKey //
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
    let arr1: any[] = [] //
    //一次性
    for (const dRow of data) {
      dRow[relateKey] = mainRow[relateMainKey] //////
      params.getMainParam = () => params
      let _res = await s.create(dRow, params) //
      arr1.push(_res) //
    }
    return arr1 //
  } //
  getRedisClient(): Redis {
    let app = this.app
    let redisClient = app.get('redisClient') //
    return redisClient
  }
  getCompanyId() {
    let app = this.app
    let companyid = app.get('companyid')
    return companyid //
  }
  getAppName() {
    let app = this.app
    let appName = app.get('appName')
    return appName //
  }
  async getMaxId(params: any = {}) {
    let id = this.id
    let serviceName = this.serviceName
    let _key = `${serviceName}_max_${id}`
    let id1 = params[_key] //
    if (id1 != null) {
      params[_key] = id1 + 1 //
      id1 = params[_key]
      return id1
    } //
    let sql = `SELECT MAX("${id}") AS max_id FROM "${serviceName}";`
    let data = await this.getModel().raw(sql)
    let _id = data.rows[0]['max_id']
    _id = _id + 1
    params[_key] = _id //
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
    //@ts-ignore    //
    const query: any = await this.db(params)
      //@ts-ignore
      .table(this.serviceName) //
      //@ts-ignore
      .insert(data, ['*'], { includeTriggerModifications: true }) //
      .toQuery()
    let _rows = null
    try {
      //
      //@ts-ignore
      let _model = await this.db(params)
      // debugger//
      let rows = await _model.raw(query)
      _rows = rows
    } catch (error) {
      let _error: any = error
      throw new errors.BadRequest(`插入数据失败${query},${_error?.message || ''}`, {}) //
    }
    _rows.sql = query //
    return _rows //
  }
  //@ts-ignore
  async find(...args) {
    return await super.find(...args)
  }
  async multiCreate(data: any, params?: any) {}
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
  async find(params?: ServiceParams): Promise<Paginated<Result> | Result[]> {
    return this._find({
      ...params,
      //@ts-ignore
      query: await this.sanitizeQuery(params)
    })
  }
  async update(
    id: Id,
    data: Partial<any>,
    params?: KnexAdapterParams<AdapterQuery> | undefined
  ): Promise<any> {
    let query = await this.sanitizeQuery(params)
    let _data = await this.formatData(data)
    //@ts-ignore
    return this._update(id, _data, {
      ...params,
      //@ts-ignore
      query: query
    })
  }
  //批量更新呢
  //@ts-ignore
  async _update(
    id: { id: any } | string | number,
    _data: any,
    params: ServiceParams = {} as ServiceParams
  ): Promise<any> {
    if (id === null || Array.isArray(_data)) {
      throw new errors.BadRequest("You can not replace multiple instances. Did you mean 'patch'?")
    }
    let whereKey = this.id
    if (typeof id == 'object') {
      let _config = id
      id = _config.id
    }
    const data = _.omit(_data, this.id)
    //@ts-ignore
    const oldData = await this._get(id, params)
    const newObject = Object.keys(oldData).reduce((result: any, key) => {
      if (key !== this.id) {
        //@ts-ignore
        // We don't want the id field to be changed
        result[key] = data[key] === undefined ? null : data[key]
      }
      return result
    }, {}) //
    let q = await this.db(params)
      .table(this.serviceName!) //
      .update(newObject, '*', { includeTriggerModifications: true })
      .where(this.id, id)
      .toQuery() //
    try {
      await this.db(params).raw(q)
    } catch (error) {
      throw new errors.BadRequest(`更新数据失败,sql=${q}`)
    }
    //@ts-ignore
    return this._get(id, params)
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
    if (filters.$limit) {
      builder.limit(filters.$limit)
    } //
    // Handle $skip
    if (filters.$skip) {
      builder.offset(filters.$skip)
    }

    // provide default sorting if its not set
    if (!filters.$sort && builder.client.driverName === 'mssql') {
      builder.orderBy(`${name}.${id}`, 'asc')
    } //
    let query = builder.toQuery()
    console.log(query) //
    let data = filters.$limit === 0 ? [] : await builder.catch(errorHandler)

    if (paginate && paginate.default) {
      //@ts-ignore
      const total = await countBuilder.then(count => parseInt(count[0] ? count[0].total : 0)) //
      return {
        total,
        //@ts-ignore
        limit: filters.$limit,
        skip: filters.$skip || 0,
        data
      }
    }
    return data
  }
  //@ts-ignore
  async patch(id: NullableId, data: any, params?: ServiceParams): Promise<any> {
    //@ts-ignore
    const { $limit, ...query } = await this.sanitizeQuery(params)
    let _data1 = await this.formatData(data) //
    return this._patch(id, _data1, {
      ...params,
      query
    })
  }
  //@ts-ignore
  async _patch(id: NullableId, raw: any, params: ServiceParams | any = {} as ServiceParams): Promise<any> {
    //@ts-ignore
    if (id === null && !this.allowsMulti('patch', params)) {
      throw new errors.MethodNotAllowed('Can not patch multiple entries')
    }
    const { name, id: idField } = this.getOptions(params) as any
    const data = _.omit(raw, this.id)
    const results: any = await this._findOrGet(id, {
      ...params,
      query: {
        //@ts-ignore
        ...params?.query,
        $select: [`${name}.${idField}`] //
      }
    })
    // console.log(results, 'testResult') //
    const idList = results.map((current: any) => current[idField])
    const updateParams = {
      ...params,
      query: {
        [`${name}.${idField}`]: { $in: idList },
        ...(params?.query?.$select ? { $select: params?.query?.$select } : {})
      }
    }
    const builder = this.createQuery(updateParams)
    //@ts-ignore
    let res = builder
      .table(this.serviceName!)
      .update(data, [], { includeTriggerModifications: true })
      .toQuery()
    await this.db(params).raw(res) //
    const items: any = await this._findOrGet(null, updateParams)
    if (id !== null) {
      if (items.length === 1) {
        return items[0]
      } else {
        throw new errors.NotFound(`No record found for id '${id}'`)
      }
    }

    return items
  }
  //@ts-ignore
  async _get(id: any, params: ServiceParams = {} as ServiceParams): Promise<Result> {
    //@ts-ignore
    const data: any = await this._findOrGet(id, params)
    if (data.length !== 1) {
      throw new errors.NotFound(`No record found for id '${id}'`)
    } //
    return data[0]
  }
  //@ts-ignore
  async _findOrGet(id: any, params?: any) {
    if (id !== null) {
      const { name, id: idField } = this.getOptions(params) //
      const builder = params.knex ? params.knex.clone() : this.createQuery(params)
      const idQuery = builder.andWhere(`${name}.${idField}`, '=', id).catch(errorHandler)
      return idQuery as any[] //
    }
    let res = await this._find({
      ...params,
      paginate: false
    })
    return res //
  }
  knexify(knexQuery: Knex.QueryBuilder, query: any = {}, parentKey?: string): Knex.QueryBuilder {
    const knexify = this.knexify.bind(this)
    return Object.keys(query || {}).reduce((currentQuery, key) => {
      const value = query[key]
      if (_.isObject(value) && !Array.isArray(value) && !(value instanceof Date)) {
        return knexify(currentQuery, value, key)
      }
      const column = parentKey || key
      const method = METHODS[key as keyof typeof METHODS]
      if (method) {
        if (key === '$or' || key === '$and') {
          // This will create a nested query
          currentQuery.where(function (this: any) {
            for (const condition of value) {
              this[method](function (this: Knex.QueryBuilder) {
                knexify(this, condition)
              })
            }
          })

          return currentQuery
        }

        return (currentQuery as any)[method](column, value)
      }

      const operator = OPERATORS[key as keyof typeof OPERATORS] || '='
      return operator === '='
        ? currentQuery.where(column, value)
        : currentQuery.where(column, operator, value)
    }, knexQuery)
  }
  //@ts-ignore
  filterQuery(params: any) {
    const options = this.getOptions(params)
    const { $select, $sort, $limit: _limit, $skip = 0, ...query } = (params.query || {}) as AdapterQuery
    const $limit = this.getLimit(_limit, options.paginate)

    return {
      paginate: options.paginate,
      filters: { $select, $sort, $limit, $skip },
      query
    }
  }
  //@ts-ignore
  getLimit(_limit: any, paginate?: any) {
    const limit = parse(_limit)
    if (paginate && (paginate.default || paginate.max)) {
      const base = paginate.default || 0
      const lower = typeof limit === 'number' && !isNaN(limit) && limit >= 0 ? limit : base
      const upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE

      return Math.min(lower, upper)
    }

    return limit
  }
}
