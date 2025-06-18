import { HookContext } from '@feathersjs/feathers'
import { useHook, useRoute } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
import { errors } from '@feathersjs/errors'
import knex from 'knex' //
@useHook({
  find: [
    async (context: HookContext, next: any) => {
      const query = context.params?.query || {}
      await next()
      const result = context.result
      let app = context.app
      let colService = app.service('columns')
      if (Array.isArray(result) && result.length > 0) {
      } else {
      } //
    } //
  ],
  create: [
    async (context, next) => {
      let data = context.data
      //   console.log(data)
      if (Array.isArray(data)) {
        data = data
      } else {
        data = [data]
      }
      let service: TableService = context.app.service('tableview')
      let params = context.params
      let db = service.db(params)
      let data1 = data.filter((row: any) => {
        let viewType = row['viewType']
        if (viewType == 'view') {
          return true
        }
        return false
      })
      for (let row of data1) {
        let sql = row['sql']
        let viewName = row['viewName']
        if (sql == null) {
          throw new errors.BadRequest('sql不能为空')
        }
        if (viewName == null) {
          throw new errors.BadRequest('viewName不能为空')
        }
        //判断视图是否已经存在
        let runSql = `CREATE OR REPLACE VIEW "${viewName}" AS ${sql};`
        await db.raw(runSql)
      } //
      let data2 = data.filter((row: any) => {
        let viewType = row['viewType']
        if (viewType == 'entity') {
          return true
        }
        return false
      })
      for (let row of data2) {
        let tableName = row['entityTableName']
        if (tableName == null) {
          throw new errors.BadRequest('entityTableName不能为空')
        }
        //查看列数据
      }
      await next()
      //添加服务
      let app: myFeathers = context.app //
      let result = context.result //
      //   console.log(result, 'testResult') //
      if (Array.isArray(result) && result.length > 0) {
        for (let res of result) {
          let viewName = res.viewName
          app.clearCache('getCompanyTable')
          await app.addService({
            options: {
              serviceName: viewName
            },
            serviceName: viewName
          }) //
        }
      }
    }
  ]
}) //
export class TableService extends BaseService {
  async saveDefaultTableInfo(tableName: string) {
    console.log('我正在执行新增') //
    let app = this.app
    // let allTable = await app.getCompanyTable(this.getCompanyId(), this.getAppName())
    let allTable = await app.getCompanyTable({
      companyid: this.getCompanyId(),
      appName: this.getAppName()
    })
    let targetTable = allTable[tableName]
    if (targetTable == null) {
      throw new errors.BadGateway('没有找到相关表格') //
    }
    await this.create({ tableName })
    let res1 = await this.find({
      query: {
        tableName: tableName //
      }
    })
    return res1 ////
  }
  async create(data: any, params?: any) {
    let res = await super.create(data, params) //
    return res
  }
  //创建实体
  @useRoute() //
  async createEntity(data: any) {
    //
  }
}

export default TableService
