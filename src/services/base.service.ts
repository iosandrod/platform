import { KnexService } from '@feathersjs/knex'
import { Knex } from 'knex'
import { Application } from '../declarations'
import { routeConfig } from '../decoration'
import { typeMap } from './validate/typeMap'
/* 
    type: 'character varying',
    maxLength: 255,
    nullable: false,
    defaultValue: null
*/
export type columnInfo = Partial<Knex.ColumnInfo & { field: string }>
export class BaseService extends KnexService {
  routes?: routeConfig[]
  columns: string[] = []
  columnInfo: columnInfo[] = []
  async setup(mainApp?: Application) {
    // console.log(mainApp,'testApp')
    const Model = this.Model
    let table = Model(this.schema) //
    let columns = await table.columnInfo()
    const allColumnName = Object.keys(columns)
    this.columns = allColumnName
    this.columnInfo = Object.entries(columns).map(([key, value]) => {
      let _value = { ...value, field: key }
      return _value
    }) //设置
    await this.buildDbSchema()
  } //模型校验
  async validate() {}
  async create(data: any, params?: any): Promise<any> {
    let _create = super.create
  }
  async buildDbSchema() {
    // const columnInfo = this.columnInfo
    // const schema = columnInfo.reduce((result: any, item) => {
    //   //
    //   let field = item.field!
    //   let type = item.type as keyof typeof typeMap
    //   result[field] = typeMap[type] //
    //   return result
    // })
    // //这是类型校验//
    // console.log(schema, 'testSchema') ////
  }
}
