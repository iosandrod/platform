import { HookContext } from '@feathersjs/feathers'
import { useHook, useIsAdmin, useRoute, useUnAuthenticate } from '../decoration'
import { BaseService } from './base.service'
import { myFeathers } from '../feather'
import { errors } from '@feathersjs/errors'
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
        //
        //获取所有表格//
        let name = res.companyid //
        // let allTable = await app.getCompanyTable(name) //
        // res.entities = allTable //
      }
    }
  ]
}) //
@useHook({
  create: [
    async function (context: any, next: any) {
      let data = context.data //
      let uid = context.app.getUserId(context) || data.userid //
      // console.log(context.params) //
      let _data = null
      if (!Array.isArray(data)) {
        _data = [data]
      } else {
        _data = data
      }
      // console.log(_data) //
      for (const data of _data) {
        if (uid) {
          data.userid = uid
        }
        data.type = 'pg'
        // let defaultConnection = context.app.get('defaultConnection')

        // let defaultConnection = context.app.getDefaultAppConnection(data)
        // let key = `${data.appName}_${data.userid}`
        // data.connection = `${defaultConnection.connection}/${key}`
        data.connection = context.app.getLocalDefaultConnection(data.appName, data.userid) //
      } //
      await next()
      let app: myFeathers = context.app //
      let _this: CompanyService = app.service('company') as any //
      let res = context.result
      for (const item of res) {
        await _this.createCompany(item) //
      } //
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
  serviceName: string = 'company' //
  unionId = ['appName', 'userid'] //
  async create(...args: any[]) {
    //@ts-ignore
    let _res = await super.create(...args) //
    return _res //
  }
  async createCompany(config: any) {
    let app = this.app
    await app.createCompany(config)
  }
  @useRoute()
  async initCompany(data: any) {}
  @useRoute()
  async getAllApp() {
    let _data = await this.find({
      query: {
        userid: -1
      }
    })
    return _data
  } //
  @useRoute()
  async registerCompany(data: any) {
    let userid = data.userid
    let appName = data.appName
    if (userid == null || appName == null) {
      throw new errors.BadRequest('参数不能为空')
    } //
    await this.app.createCompany(data) //
    return '创建成功' //
  }
  @useRoute()
  async getAllRegisterCompany() {
    let allCompany = await this.app.getAllCompany() //
    allCompany = allCompany.map((item: any) => {
      return {
        ...item,
        entities: []
      } //
    })
    let query = allCompany.map((item: any) => {
      let userid = item.userid
      return userid
    })
    let users = await this.app.service('users').find({
      query: {
        id: {
          $in: query
        }
      }
    })
    allCompany = allCompany
      .map((item: any) => {
        item.user = users.find((user: any) => user.id == item.userid)
        return item
      })
      .filter((item: any) => item.user != null) //
    return allCompany //
  }
  // @useUnAuthenticate() //
  @useRoute()
  @useUnAuthenticate() //
  getAppConfig(data: any) {
    let appName = data.appName //
    let config = {} //
    let NODE_ENV: any = process.env.NODE_ENV
    let _config: any = this.app.get(NODE_ENV) //
    let _config1 = _config?.[appName] || {}
    return _config1 //
  }
  @useRoute()
  getAllAppCompany(data: any) {
    let appName = data?.appName
    if (appName == null) {
      return
    }
    let query = {
      appName
    }
    let allCompany = this.find({
      query
    }) //
    return allCompany //
  }
  //
  @useRoute()
  async getAllAccountCompany(data: any) {
    let mainApp = this.app.getMainApp()!
    let mainService = mainApp.service('company')
    let appName = data?.appName
    if (appName == null) {
      throw new errors.BadRequest('应用不能为空')
    }
    let query = {
      appName: {
        $like: `${appName}%` //
      },
      //id大于0
      userid: {
        $gt: 0
      }
    } //
    let allCompany = await mainService.find({
      query
    })
    return allCompany //
  }
  @useRoute()
  @useIsAdmin()
  async testC() {
    return 'success' //
  }
}

export default CompanyService
