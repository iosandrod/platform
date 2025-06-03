import {
  errorHandler,
  KnexAdapterOptions,
  KnexAdapterParams,
  KnexService,
  transaction
} from '@feathersjs/knex'
import knex, { Knex, QueryBuilder } from 'knex'
import { Application, HookContext } from '../declarations'
import {
  _authenticate,
  cacheValue,
  routeConfig,
  useAuthenticate,
  useGlobalAuthenticate,
  useGlobalRoute,
  useHook,
  useRoute
} from '../decoration'
import { typeMap } from './validate/typeMap'
import { AdapterQuery, FilterQueryOptions, VALIDATED } from '@feathersjs/adapter-commons'
import { ServiceParams } from '@feathersjs/transport-commons/lib/http'
import _, { result } from 'lodash'

//@ts-ignore
import { format } from '@scaleleap/pg-format'
import { defaultServiceMethods, Id, NullableId, Paginated, Params, Query } from '@feathersjs/feathers'
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
import { filterQuery, FILTERS } from './query'
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
  unionId: any[] = [] //
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
    let _this: any = this
    let metaData = _this.hooksMetaData
    if (metaData == null) {
      _this.hooksMetaData = []
      metaData = _this.hooksMetaData //
    }
    let r = this.routes || []
    let r1 = this._routes || []
    if (r1.length > 0) {
      // console.log(r1) //
    }
    let dMethods = [...defaultServiceMethods, ...r.map(r => r.path), ...r1.map(r => r.path)]
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
        ['create', 'update', 'patch', 'remove', 'batchUpdate'].includes(item) && //
        !unAuthMethods.includes(item)
      ) {
        //
        let arr1 = [
          // _authenticate('jwt'), //
          async (context: HookContext, next: any) => {
            let params = context.params
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
      } //
      //开启事务
      if (['create', 'update', 'patch', 'remove', 'batchUpdate'].includes(item)) {
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
    _this.hooksMetaData?.push(_hook)
    return this
  }
  app: myFeathers //
  routes?: routeConfig[] //
  _routes?: routeConfig[] //
  columns: string[] = [] ////
  columnInfo: columnInfo[] = []
  get id() {
    let _id = this.options.id as string
    // console.log('kdjfldsjflksdfjsdlkfjklds ' , _id)
    return _id
  }
  getCompanyName() {}
  //@ts-ignore
  createQuery(params: ServiceParams = {} as ServiceParams) {
    let { name, id } = this.getOptions(params)
    //@ts-ignore
    let { filters, query } = this.filterQuery(params) //
    //@ts-ignore
    let builder = this.db(params).table(this.serviceName) //
    // $select uses a specific find syntax, so it has to come first.
    if (filters.$select) {
      let select = filters.$select.map(column => (column.includes('.') ? column : `${name}.${column}`))
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
    //@ts-ignore
    this.app = mainApp
    let Model = this.Model
    let appName = this.getAppName()
    let companyid = this.getCompanyId()
    let allT = await this.app.getCompanyTable(companyid, appName) //
    let columns = allT[this.serviceName!]?.columns || []
    if (columns.length == 0) {
    }
    let allColumnName = columns.map((col: any) => col.field) //
    this.columns = allColumnName //
    this.columnInfo = columns ////
    let routes = this.routes
    if (!routes) {
      this.routes = []
      routes = this.routes
    }
    //构建校验
    await this.buildDbSchema() //
  }
  //@ts-ignore
  db(params?: ServiceParams): Knex {
    let { Model, name, schema, tableOptions } = this.getOptions(params)
    //@ts-ignore
    if (params && params.transaction && params.transaction.trx) {
      //@ts-ignore
      // let _t: Knex.Transaction = params.transaction
      //@ts-ignore
      let { trx } = params.transaction //
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
    let errors = vSchema.errors || []
    return errors //
  }
  async formatData(data: any): Promise<any> {
    //
    let columnInfo = this.columnInfo
    let resolveData = null
    if (Array.isArray(data)) {
      data = data.filter(v => v != null)
      let r = []
      for (const d of data) {
        let d1 = await this.formatData(d)
        r.push(d1)
      }
      resolveData = r //
    } else {
      resolveData = Object.entries(data).reduce((result: any, [key, value]) => {
        let tCol = columnInfo.find(item => item.field == key)
        if (tCol) {
          let type = tCol.type
          if (type == 'jsonb' || type == 'json') {
            if (typeof value == 'object') {
              value = JSON.stringify(value)
            }
          }
          if (typeof value == 'boolean') {
            if (value === true) {
              value = 1
            } else {
              value = 0 //
            }
          }
          //@ts-ignore
          if (['integer', 'decimal'].includes(type)) {
            if (typeof value == 'string') {
              let n = Number(value)
              if (!isNaN(n)) {
                value = n //
              }
            }
          } //
          result[key] = value
        } //
        return result
      }, {}) //
    }
    return resolveData
  }
  async checkCompositeExists(
    knex: Knex,
    table: string,
    keyColumns: string[],
    valuePairs: (string | number)[][]
  ): Promise<any> {
    if (keyColumns.length === 0 || valuePairs.length === 0) return []

    const formattedValues = valuePairs.map(pair => `(${pair.map(() => '?').join(', ')})`).join(', ')

    const flatValues = valuePairs.flat()

    const whereClause = `(${keyColumns.map(col => `"${col}"`).join(', ')}) IN (${formattedValues})`
    let result = await knex(table).select('*').whereRaw(whereClause, flatValues).toSQL()
    let _res = await this.db().raw(result.sql, result.bindings)
    let _d = _res?.rows
    if (_d.length > 0) {
      throw new errors.BadRequest(`联合主键重复${keyColumns}`) //
    }
    return _d //
  }
  async create(data: any, params?: any): Promise<any> {
    let route = params['route']
    if (typeof params?.getMainParam == 'function') {
      params = params.getMainParam()
    } //
    let uid = this.unionId
    if (uid?.length > 1) {
      await this.validateUid(data) //
    }
    let _res = await this._create(data, params) ////
    return _res?.rows || _res //
  } //

  async validateUid(data: any[]) {
    if (!Array.isArray(data)) {
      data = [data] //
    }
    let uid = this.unionId
    let _data = data.map(row => {
      let arr = uid.map(v => {
        let v1 = row[v]
        if (v1 == null) {
          throw new errors.BadRequest(`联合主键${v}不能为空`)
        } //
        return v1
      })
      return arr
    })
    await this.checkCompositeExists(this.db(), this.serviceName!, uid, _data)
    return
  }
  async _createDetailData(
    config: {
      detailConfig?: any
      data: any[]
      mainRow: any
      tableName?: string
      relateKey?: string
      relateMainKey?: string
    },
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
    let _obj = data.reduce(
      (result: any, item: any) => {
        let _rowState = item._rowState
        if (_rowState == 'add') {
          item[relateKey] = mainRow[relateMainKey]
          result.addData.push(item)
        }
        if (_rowState == 'change') {
          item[relateKey] = mainRow[relateMainKey] //
          result.patchData.push(item) //
        }
        return result
      },
      {
        addData: [],
        patchData: [],
        removeData: []
      }
    )
    await s.batchUpdate(_obj, params) //

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
    if (Array.isArray(_data)) {
      let _res1 = []
      for (const data4 of _data) {
        let _res2: any = await this._create(data4, _params)
        _res1.push(_res2)
      }
      return _res1 //
    }
    let data = _data as any //
    let params: any = _params
    let _data1 = data
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
    let resolveData = await this.formatData(data) //
    data = resolveData //
    let vResult = await this.validate(resolveData, params) //
    if (vResult?.length! > 0) {
      let fError = vResult[0]
      throw new Error(`${this.serviceName}数据校验出错,出错信息${JSON.stringify(fError)}`) //
    }
    //@ts-ignore
    //@ts-ignore    //
    let query: any = await this.db(params)
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
    let _res = _rows
    let targetRow = _res.rows[0] //
    let _relateData = _data1['_relateData'] //关联数据
    if (_relateData != null && typeof _relateData == 'object') {
      for (const [key, object] of Object.entries(_relateData)) {
        let dTableName = key //子表表名
        let _obj = object as any
        let data2 = _obj.data || []
        let required = _obj.required //是否必须有数据
        if (data2.length == 0 && required == true) {
          throw new errors.BadRequest(`子表${dTableName}必须有数据`) //
        }
        await this._createDetailData(
          {
            data: data2,
            mainRow: targetRow,
            tableName: dTableName,
            detailConfig: _obj,
            relateKey: _obj.relateKey,
            relateMainKey: _obj.relateMainKey
          }, //
          params
        ) //
      }
    }
    return _rows //
  } //
  //@ts-ignore
  async sanitizeQuery(params: any = {} as ServiceParams): Promise<Query> {
    // We don't need legacy query sanitisation if the query has been validated by a schema already
    //@ts-ignore
    if (params.query && (params.query as any)[VALIDATED]) {
      //@ts-ignore
      return params.query || {}
    }
    let _query = params.query || {}
    let $paginate = _query['$paginate']
    if ($paginate != null) {
      //
      if (typeof $paginate == 'object') {
        let _default = $paginate.default
        if (_default == null) {
          $paginate = null //
        } //
      }
      if (typeof $paginate == 'number' || typeof $paginate == 'string') {
        let _n = Number($paginate)
        if (isNaN(_n)) {
          $paginate = null //
        } else {
          $paginate = { default: _n, max: 20000 } //
        }
      } //
      params.paginate = params.paginate || $paginate
      delete _query['$paginate'] ////
    } //
    const options = this.getOptions(params)
    const { query, filters } = filterQuery(params.query, options)
    return {
      ...filters,
      ...query
    }
  }

  async multiCreate(data: any, params?: any) {}
  async buildDbSchema() {
    let columnInfo = this.columnInfo
    let schema = columnInfo.reduce((result: any, item) => {
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
      'date', //
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
    let { Model } = this.getOptions(params)
    return Model
  }
  //@ts-ignore
  getOptions(params: any = {}): KnexAdapterOptions {
    let paginate = params.paginate !== undefined ? params.paginate : this.options.paginate
    return {
      ...this.options,
      paginate,
      ...params.adapter
    }
  }
  //@ts-ignore

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
  //@ts-ignore
  async _update(
    id: { id: any } | string | number,
    _data: any,
    params: ServiceParams = {} as ServiceParams
  ): Promise<any> {
    if (id === null || Array.isArray(_data)) {
      throw new errors.BadRequest("You can not replace multiple instances. Did you mean 'patch'?")
    }
    if (typeof id == 'object') {
      let _config = id
      id = _config.id
    }
    let data = _.omit(_data, this.id)
    //@ts-ignore
    let oldData = await this._get(id, params)
    let newObject = Object.keys(oldData).reduce((result: any, key) => {
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
  async find(params?: any): Promise<any[]> {
    let q = await this.sanitizeQuery(params)
    // console.log(q, params)
    //@ts-ignore
    return this._find({
      ...params,
      //@ts-ignore//
      query: q //
    })
  }
  //@ts-ignore
  async _find(params: ServiceParams = {} as ServiceParams): Promise<Paginated<any> | any[]> {
    // console.log(params, 'sfjkdslfjslfsd')//
    //@ts-ignore
    let { filters, paginate } = this.filterQuery(params)
    // console.log(paginate, 'testP')//
    //@ts-ignore
    let { name, id } = this.getOptions(params)
    //@ts-ignore
    let builder = params.knex ? params.knex.clone() : this.createQuery(params)
    let countBuilder = builder.clone().clearSelect().clearOrder().count(`${name}.${id} as total`)
    let _limit = filters.$limit
    if (_limit == null) {
      filters.$limit = 1000 //
    }
    if (filters.$limit) {
      builder.limit(filters.$limit)
    } //
    // Handle $skip
    if (filters.$skip) {
      builder.offset(filters.$skip)
    }

    // provide default sorting if its not set
    // if (!filters.$sort && builder.client.driverName === 'mssql') {
    if (!filters.$sort && ['mssql', 'pg'].includes(builder.client.driverName)) {
      builder.orderBy(`${name}.${id}`, 'asc') //
    } //
    let query = builder.toQuery()
    console.log(query) //
    let data = filters.$limit === 0 ? [] : await builder.catch(errorHandler)

    if (paginate && paginate.default) {
      //@ts-ignore
      let total = await countBuilder.then(count => parseInt(count[0] ? count[0].total : 0)) //
      return {
        total,
        //@ts-ignore
        limit: filters.$limit,
        skip: filters.$skip || 0, //
        data //
      }
    }
    return data
  }
  //@ts-ignore
  async patch(id: NullableId, data: any, params?: any): Promise<any> {
    //@ts-ignore
    let { $limit, ...query } = await this.sanitizeQuery(params)
    if (Array.isArray(id) || (typeof id == 'object' && id != null)) {
      let _data = data
      data = id
      id = null //
      params = _data //
    } //
    return this._patch(id, data, {
      ...params,
      query
    })
  }
  //@ts-ignore
  allowsMulti(method: string, params: ServiceParams = {} as ServiceParams) {
    if (1 == 1) {
      return true
    }
    let { multi } = this.getOptions(params)
    if (multi === true || !multi) {
      return multi
    }
    return multi.includes(method)
  }
  //@ts-ignore//
  async _patch(id: NullableId, raw1: any, params: ServiceParams | any = {} as ServiceParams): Promise<any> {
    //@ts-ignore
    if (id === null && !this.allowsMulti('patch', params)) {
      throw new errors.MethodNotAllowed('Can not patch multiple entries')
    }
    let data = null
    if (Array.isArray(raw1)) {
      data = raw1
    } else {
      data = [raw1]
    } //
    let originData = data //
    let raw = await this.formatData(data) //
    data = raw //
    let { name, id: idField } = this.getOptions(params) as any

    let queryObj = {
      ...params.query
    }
    let resArr = []
    if (id == null) {
      let _r = raw
      if (!Array.isArray(_r)) {
        _r = [_r]
      }
      let idL = _r.map((r: any) => r[idField])
      queryObj[`${name}.${idField}`] = { $in: idL }
    } //
    let sqlArr = []
    let buildArr = []
    let _qArr = []
    if (data.length == 1) {
      //
      // console.log(queryObj, 'qObj') //
      let results: any = await this._findOrGet(id, {
        ...params,
        query: queryObj
      })
      _qArr.push(queryObj) //
      // console.log(results, 'testRes')
      let idList = results.map((current: any) => current[idField])
      for (const d of data) {
        let updateParams = {
          ...params,
          query: {
            [`${name}.${idField}`]: { $in: idList },
            ...(params?.query?.$select ? { $select: params?.query?.$select } : {})
          }
        }
        delete d[idField]
        let builder = this.createQuery(updateParams)
        let res = builder
          .table(this.serviceName!)
          .update(d, [], { includeTriggerModifications: true })
          .toSQL()
        sqlArr.push(res.sql)
        buildArr.push(res.bindings)
      }
    } else {
      for (const d of data) {
        let idList = [d].map((current: any) => current[idField]).filter((current: any) => current != null)
        let qObj = {
          ...(params?.query?.$select ? { $select: params?.query?.$select } : {})
        }
        if (idList.length > 0) {
          //@ts-ignore
          qObj[`${name}.${idField}`] = { $in: idList }
        }
        let updateParams = {
          ...params,
          query: {
            [`${name}.${idField}`]: { $in: idList },
            ...(params?.query?.$select ? { $select: params?.query?.$select } : {})
          }
        }
        let _q = updateParams.query //
        _qArr.push(_q)
        delete d[idField]
        if (Object.keys(d).length == 0) {
          continue //
        }
        let builder = this.createQuery(updateParams)
        let res = builder
          .table(this.serviceName!)
          .update(d, [], { includeTriggerModifications: true })
          .toSQL()
        sqlArr.push(res.sql)
        buildArr.push(res.bindings)
      }
    }

    resArr = await Promise.all(
      sqlArr.map(async (s, i) => {
        return await this.db(params).raw(s, buildArr[i]) //
      })
    )
    if (resArr.length == 1) {
      let _data = originData
      for (const row of _data) {
        let _data1 = row
        let _relateData = _data1['_relateData'] //关联数据
        if (_relateData != null && typeof _relateData == 'object') {
          for (const [key, object] of Object.entries(_relateData)) {
            let dTableName = key //子表表名
            let _obj = object as any
            let data2 = _obj.data || []
            // let required = _obj.required //是否必须有数据
            // if (data2.length == 0 && required == true) {
            //   throw new errors.BadRequest(`子表${dTableName}必须有数据`) //
            // }
            await this._createDetailData(
              {
                data: data2,
                mainRow: _data1, //
                tableName: dTableName,
                detailConfig: _obj,
                relateKey: _obj.relateKey,
                relateMainKey: _obj.relateMainKey
              }, //
              params
            ) //
          }
        }
      }
    }
    let allD = await this.find({
      query: {
        $or: _qArr
      }
    })
    return allD //
  }
  //@ts-ignore
  async _get(id: any, params: ServiceParams = {} as ServiceParams): Promise<Result> {
    //@ts-ignore
    let data: any = await this._findOrGet(id, params)
    if (data.length !== 1) {
      throw new errors.NotFound(`No record found for id '${id}'`)
    } //
    return data[0]
  }
  //@ts-ignore
  async _findOrGet(id: any, params?: any) {
    if (id !== null) {
      let { name, id: idField } = this.getOptions(params) //
      let builder = params.knex ? params.knex.clone() : this.createQuery(params)
      let idQuery = builder.andWhere(`${name}.${idField}`, '=', id).catch(errorHandler)
      return idQuery as any[] //
    }
    let res = await this._find({
      ...params,
      paginate: false
    })
    return res //
  }
  knexify(knexQuery: Knex.QueryBuilder, query: any = {}, parentKey?: string): Knex.QueryBuilder {
    let knexify = this.knexify.bind(this)
    return Object.keys(query || {}).reduce((currentQuery, key) => {
      let value = query[key]
      if (_.isObject(value) && !Array.isArray(value) && !(value instanceof Date)) {
        return knexify(currentQuery, value, key)
      }
      let column = parentKey || key
      let method = METHODS[key as keyof typeof METHODS]
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

      let operator = OPERATORS[key as keyof typeof OPERATORS] || '='
      return operator === '='
        ? currentQuery.where(column, value)
        : currentQuery.where(column, operator, value)
    }, knexQuery)
  }
  //@ts-ignore
  filterQuery(params: any) {
    let options = this.getOptions(params)
    let { $select, $sort, $limit: _limit, $skip = 0, ...query } = (params.query || {}) as AdapterQuery
    let $limit = this.getLimit(_limit, options.paginate)

    return {
      paginate: options.paginate,
      filters: { $select, $sort, $limit, $skip },
      query
    }
  }
  //@ts-ignore
  getLimit(_limit: any, paginate?: any) {
    let limit = parse(_limit)
    if (paginate && (paginate.default || paginate.max)) {
      let base = paginate.default || 0
      let lower = typeof limit === 'number' && !isNaN(limit) && limit >= 0 ? limit : base
      let upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE

      return Math.min(lower, upper)
    }

    return limit
  }
  getId() {
    return this.id //
  }
  initHooks(app: any) {
    let serviceName = this.serviceName
    let path = serviceName
    let service: any = this
    let hooksMetaData = service.hooksMetaData
    if (hooksMetaData != null && Array.isArray(hooksMetaData)) {
      for (const hook of hooksMetaData) {
        hooks(service, hook)
      }
    }
    let _hooksMetaData = service._hooksMetaData
    if (_hooksMetaData != null && Array.isArray(_hooksMetaData)) {
      for (const hook of _hooksMetaData) {
        hooks(service, hook) //
      }
    }
    let routes = service.routes || [] //
    let _routes = service._routes || [] //
    let routesMethods = routes.map((route: any) => route.path) //
    let _routeMethods = _routes.map((route: any) => route.path) //
    let p = serviceName //
    //@ts-ignore
    let ts = app.use(p, service, {
      //
      //@ts-ignore
      methods: [...defaultServiceMethods, ...routesMethods, ..._routeMethods], // //
      koa: {
        before: [
          async (context: any, next: any) => {
            await next()
          }
        ],
        after: [
          async (context: any, next: any) => {
            await next() ////
            const response = context.response
            response.body = {
              data: response.body,
              code: 200
            } //////
          }
        ]
      }
    })
  } //
  //批量
  // @useRoute()
  @useGlobalRoute()
  // @useGlobalAuthenticate() //
  async batchUpdate(data: any, params: any) {
    //@ts-ignore//
    let _data = data
    // console.log(_data, 'test_data')//
    let addData = _data['addData'] || []
    let patchData = _data['patchData'] || []
    let delData = _data['delData'] || []
    if (addData?.length > 0) {
      //
      await this.create(addData, params)
    }
    if (patchData?.length > 0) {
      //
      await this.patch(patchData, { ...params, query: {} }) //
    } //
    if (delData?.length > 0) {
      await this.remove(delData, { ...params, query: {} })
    }
    return '数据更新成功' //
  }
  //@ts-ignorex
  async remove(id: any, params?: any, data?: any): Promise<Result | Result[]> {
    // console.log(id, params?.query, data, 'remove') //
    const { $limit, ...query } = await this.sanitizeQuery(params)
    return this._remove(id, {
      ...params,
      query
    })
  }
  @useGlobalRoute() //
  async batchDelete(data: any, params: any) {
    let _r = await this.remove(data, params)
    // return '数据删除成功' //
    return _r
  } //
  //@ts-ignore
  async _remove(id: any, params: any = {} as ServiceParams): Promise<any> {
    if (id === null && !this.allowsMulti('remove', params)) {
      return
    } //
    let { query } = this.filterQuery(params)
    if (id == null && Object.keys(query).length == 0) {
      throw new errors.NotFound(`没有设置删除条件`) //
    }
    let q: any = this.db(params)
    if (Array.isArray(id)) {
      id = id
    } else {
      id = [id] //
    }
    id = id
      .filter((id: any) => id != null)
      .map((id: any) => {
        if (typeof id == 'number') {
          return id
        }
        return id[this.id] //
      })
    // console.log(id, 'sjfkslfdslkkfsdf') // //
    if (id.length == 0 && Object.keys(query).length == 0) {
      //
      throw new errors.NotFound(`没有设置删除条件`)
    }
    let items = id.map((current: any) => current[this.id])
    // const idList = items.map((current: any) => current[this.id])
    let idList: any[] = id
    let q1 = {
      [this.id]: { $in: idList }
    }
    q = q.table(this.serviceName) //
    q = this.knexify(q, query)
    q = this.knexify(q, q1) //
    // let s= q.delete([], { includeTriggerModifications: true }).catch(errorHandler)
    let s = q.delete([], { includeTriggerModifications: true }).toSQL()
    // if (1 == 1) {
    //   return s //
    // }
    let sql = s.sql
    let bindings = s.bindings
    // console.log(sql, 'sql') //
    let _res = await this.db().raw(sql, bindings)
    // if (id !== null) {
    //   if (items.length === 1) {
    //     return items[0]
    //   }
    //   throw new errors.NotFound(`No record found for id '${id}'`)
    // }
    // return items
    return '删除单据成功' //
  }
}
//
