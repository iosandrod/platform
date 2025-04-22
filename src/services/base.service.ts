import { errorHandler, KnexAdapterParams, KnexService } from '@feathersjs/knex'
import { Knex } from 'knex'
import { Application, HookContext } from '../declarations'
import { routeConfig, useHook } from '../decoration'
import { typeMap } from './validate/typeMap'
import { AdapterQuery } from '@feathersjs/adapter-commons'
import { ServiceParams } from '@feathersjs/transport-commons/lib/http'
import _, { result } from 'lodash'
//@ts-ignore
import { format } from '@scaleleap/pg-format'
import { defaultServiceMethods, Params } from '@feathersjs/feathers'
import { TObject, TPick, Type } from '@feathersjs/typebox'
import Ajv, { ValidateFunction } from 'ajv'
import { addFormats } from '@feathersjs/schema'
//如何处理枚举类型
const RETURNING_CLIENTS = ['postgresql', 'pg', 'oracledb', 'mssql', 'sqlite3']

export type columnInfo = Partial<Knex.ColumnInfo & { field: string }>
import { hooks } from '@feathersjs/hooks'
import { myFeathers } from '../feather'

export class BaseService extends KnexService {
  serviceName?: string //
  // hooksMetaData?: any[]=[]
  transformMetaData?: any
  vSchema?: ValidateFunction
  totalSchema?: TObject
  pickSchame?: TPick<any, any>
  constructor(options: any) {
    super(options)
    this.hooksMetaData = []
    let r = this.routes || []

    let dMethods = [...defaultServiceMethods, ...r.map(r => r.path)]
    dMethods = dMethods.filter(
      (v, i) => dMethods.indexOf(v) == i //
    )
    let _hook = dMethods.reduce((result: any, item: any) => {
      result[item] = [
        async (context: HookContext, next: any) => {
          let m = context.method
          const params=context.params
          console.log(params,'testParams')//
          await next()
        }
      ]
      return result
    }, {})
    this.hooksMetaData.push(_hook)
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
  //类型校验
  async validate(data: any, params: Params) {
    //必录入校验
    let vSchema = this.vSchema!
    await vSchema(data)
    const errors = vSchema.errors || []
    return errors //
  }
  async create(data: any, params?: any): Promise<any> {
    //获取数据库的字段
    if (Array.isArray(data)) {
      let result = await this.multiCraete(data, params)
      return result
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
    return _res //
    // return vResult
  }
  //@ts-ignore
  async _create(_data: any, _params: ServiceParams = {} as ServiceParams) {
    let data = _data as any
    const params = _params as KnexAdapterParams
    //@ts-ignore
    const { client } = this.db(params)
    const returning = RETURNING_CLIENTS.includes(client.driverName) ? [this.id] : []
    const query: any = await this.db(params)
      .insert(data, returning, { includeTriggerModifications: true })
      .toQuery()
    let rows = await this.Model.raw(query).catch(errorHandler) //
    let _rows: any[] = rows //
    return _rows //
  }
  //@ts-ignore
  async find(...args) {
    // if (this.serviceName == 't_SdOrder') {
    //   debugger //
    // }
    // //@ts-ignore
    // console.log(this.hooksMetaData)//
    return await super.find(...args)
  }
  async multiCraete(data: any, params?: any) {}
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
}
