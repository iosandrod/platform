import { HookContext } from '@feathersjs/feathers'
import { useHook } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
@useHook({
  //
  find: [
    //
    async function (context: HookContext, next: any) {
      await next()
      const res = context
      const result = res.result // isArray
      //@ts-ignore
      const app: myFeathers = context.app //
      // let users = await context.app.service('users').find()
      // console.log(users, 'testUsers')//
      for (const res of result) {
        //获取所有表格//
        let name = res.companyid //
        let allTable = await app.getCompanyTable(name) //
        res.entities = allTable //
      }
    }
  ]
}) //
@useHook({
  create: [
    async function (context: any, next: any) {
      let data = context.data
      let uid = context?.params?.user?.id
      let _data = null
      if (!Array.isArray(data)) {
        _data = [data]
      } else {
        _data = data
      }
      for (const data of _data) {
        if (uid) {
          data.userid = uid
        }
        data.type = 'pg'
        let defaultConnection = context.app.get('defaultConnection')
        let key = `${data.appName}_${data.userid}` //
        data.connection = `${defaultConnection.connection}/${key}`
      }
      await next() //
      //创建数据库//
      let app: myFeathers = context.app //
      let _this: CompanyService = app.service('company') as any //
      let res = context.result
      for (const item of res) {
        await _this.createCompany(item.appName, item.userid) //
      }
    }
  ] //
})
@useHook({
  create: [
    async function (context: any, next: any) {
      let data = context.data //
      await next()
    }
  ]
})
export class CompanyService extends BaseService {
  //联合
  unionId = ['appName', 'userid'] //
  async create(...args: any[]) {
    //@ts-ignore
    let _res = await super.create(...args) //
    return _res //
  }
  //生成公司数据库
  async createCompany(appName: any, userid: any) {
    //创建数据库//
    let app = this.app
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
    await pgClient.raw(sql) //
  }
}

export default CompanyService
